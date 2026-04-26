"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState, type FormEvent } from "react";
import { Hotel as HotelIcon, ShieldAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PageHeader } from "@/components/admin/PageHeader";
import { PermissionPicker } from "@/components/admin/PermissionPicker";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";
import { ApiError, getValidationErrors, toastApiError } from "@/lib/api-client";
import { listHotels } from "@/lib/api/hotels";
import { listPermissions } from "@/lib/api/permissions";
import { listRoles } from "@/lib/api/roles";
import {
  getUser,
  syncUserPermissions,
  syncUserRoles,
} from "@/lib/api/users";
import type { AuthUser, Paginated, Permission, Role } from "@/types/auth";
import type { Hotel } from "@/types/booking";

const HOTEL_MANAGER_ROLE = "hotel-manager";
const SUPERADMIN_ROLE = "superadmin";

const SYSTEM_ROLES = new Set([
  "superadmin",
  "hotel-manager",
  "ferry-manager",
  "park-manager",
  "beach-manager",
  "customer",
]);

async function fetchAllHotels(): Promise<Hotel[]> {
  const collected: Hotel[] = [];
  let page = 1;
  for (let safety = 0; safety < 50; safety++) {
    const res: Paginated<Hotel> = await listHotels(page);
    collected.push(...res.data);
    if (page >= res.meta.last_page) return collected;
    page++;
  }
  return collected;
}

function arraysEqualUnordered<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set<T>(a);
  for (const item of b) if (!set.has(item)) return false;
  return true;
}

export default function UserAccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const userId = Number(id);
  const invalid = Number.isNaN(userId);

  const { user: authUser, refreshUser } = useAuth();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [userLoading, setUserLoading] = useState(!invalid);
  const [userError, setUserError] = useState("");

  const [allRoles, setAllRoles] = useState<Role[] | null>(null);
  const [allHotels, setAllHotels] = useState<Hotel[] | null>(null);
  const [catalogue, setCatalogue] = useState<Permission[] | null>(null);
  const [bootstrapError, setBootstrapError] = useState("");

  // Card A — Roles + managed_hotels
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<number[]>([]);
  const [hotelsTouched, setHotelsTouched] = useState(false);
  const [savingA, setSavingA] = useState(false);
  const [errorA, setErrorA] = useState("");
  const [fieldErrorsA, setFieldErrorsA] = useState<Record<string, string[]>>({});

  // Card B — Direct permissions
  const [directPerms, setDirectPerms] = useState<string[]>([]);
  const [savingB, setSavingB] = useState(false);
  const [errorB, setErrorB] = useState("");

  useEffect(() => {
    if (invalid) return;
    let cancelled = false;
    getUser(userId)
      .then((res) => {
        if (cancelled) return;
        const u = res.data;
        setUser(u);
        setSelectedRoles([...(u.roles ?? [])]);
        setSelectedHotels([...(u.managed_hotel_ids ?? [])]);
        setDirectPerms([...(u.direct_permissions ?? [])]);
        setUserError("");
        setUserLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setUserError(err.message || "Failed to load user.");
        } else {
          setUserError("Failed to load user.");
        }
        setUserLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, invalid]);

  useEffect(() => {
    if (invalid) return;
    let cancelled = false;
    Promise.all([listRoles(), fetchAllHotels(), listPermissions()])
      .then(([rolesRes, hotelsRes, permsRes]) => {
        if (cancelled) return;
        setAllRoles(rolesRes.data);
        setAllHotels(hotelsRes);
        setCatalogue(permsRes.data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof Error) {
          setBootstrapError(err.message || "Failed to load form data.");
        } else {
          setBootstrapError("Failed to load form data.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [invalid]);

  // Self-lockout guard: editing yourself + currently a superadmin → can't
  // remove your own superadmin role. Belt-and-braces null-safety on roles
  // because this block runs before the early-return on `!user`.
  const editingSelf = authUser?.id === user?.id;
  const userHasSuperadmin = (user?.roles ?? []).includes(SUPERADMIN_ROLE);
  const cannotUncheckSuperadmin = editingSelf && userHasSuperadmin;

  // Last-superadmin guard: derive from listRoles' users_count.
  const superadminRole = useMemo(
    () => allRoles?.find((r) => r.name === SUPERADMIN_ROLE) ?? null,
    [allRoles],
  );
  const isLastSuperadmin =
    !!superadminRole &&
    (superadminRole.users_count ?? 0) === 1 &&
    userHasSuperadmin;

  const hotelManagerSelected = selectedRoles.includes(HOTEL_MANAGER_ROLE);

  const cardADirty =
    !!user &&
    (!arraysEqualUnordered(selectedRoles, user.roles) ||
      (hotelManagerSelected && hotelsTouched));

  const cardBDirty =
    !!user && !arraysEqualUnordered(directPerms, user.direct_permissions ?? []);

  const toggleRole = (name: string, checked: boolean) => {
    if (checked) {
      if (selectedRoles.includes(name)) return;
      setSelectedRoles([...selectedRoles, name]);
    } else {
      if (name === SUPERADMIN_ROLE && cannotUncheckSuperadmin) return;
      setSelectedRoles(selectedRoles.filter((r) => r !== name));
    }
  };

  const toggleHotel = (hotelId: number, checked: boolean) => {
    setHotelsTouched(true);
    if (checked) {
      if (selectedHotels.includes(hotelId)) return;
      setSelectedHotels([...selectedHotels, hotelId]);
    } else {
      setSelectedHotels(selectedHotels.filter((id) => id !== hotelId));
    }
  };

  const onSubmitRoles = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSavingA(true);
    setErrorA("");
    setFieldErrorsA({});

    // Three semantics for managed_hotels per the backend brief:
    //   absent       → preserve (when hotel-manager is being kept)
    //   present []   → clear
    //   present arr  → replace
    // We omit when hotel-manager is being removed (backend auto-clears) or
    // when the operator hasn't touched the picker (preserve existing).
    const payload: { roles: string[]; managed_hotels?: number[] } = {
      roles: selectedRoles,
    };
    if (hotelManagerSelected && hotelsTouched) {
      payload.managed_hotels = selectedHotels;
    }

    try {
      const res = await syncUserRoles(user.id, payload);
      setUser(res.data);
      setSelectedRoles([...res.data.roles]);
      setSelectedHotels([...(res.data.managed_hotel_ids ?? [])]);
      setHotelsTouched(false);
      toast.success("Roles updated.");
      if (editingSelf) await refreshUser();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422) {
          setFieldErrorsA(getValidationErrors(err));
        } else if (err.status === 409) {
          setErrorA(err.message);
        } else {
          toastApiError(err);
        }
      } else {
        toastApiError(err);
      }
    } finally {
      setSavingA(false);
    }
  };

  const onSubmitPerms = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSavingB(true);
    setErrorB("");
    try {
      const res = await syncUserPermissions(user.id, {
        permissions: directPerms,
      });
      setUser(res.data);
      setDirectPerms([...(res.data.direct_permissions ?? [])]);
      toast.success("Direct permissions updated.");
      if (editingSelf) await refreshUser();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const errs = getValidationErrors(err);
        // The error key comes back as `permissions.0`, `permissions.1`, etc.
        // Surface the first one inline; toast the rest.
        const firstKey = Object.keys(errs)[0];
        setErrorB(firstKey ? errs[firstKey][0] : err.message);
      } else if (err instanceof ApiError) {
        toastApiError(err);
      } else {
        toastApiError(err);
      }
    } finally {
      setSavingB(false);
    }
  };

  if (invalid) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        Invalid user id.
      </p>
    );
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (userError) {
    return (
      <p className="py-20 text-center text-sm text-destructive">{userError}</p>
    );
  }

  if (!user) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        User not found.
      </p>
    );
  }

  const directSet = new Set(user.direct_permissions ?? []);
  const roleDerivedPerms = (user.permissions ?? []).filter(
    (p) => !directSet.has(p),
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Users", href: "/admin/users" },
          { label: user.name },
        ]}
      />

      <PageHeader
        title={`Access — ${user.name}`}
        description={user.email}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/users")}
          >
            Back to users
          </Button>
        }
      />

      {bootstrapError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {bootstrapError}
        </p>
      ) : null}

      {/* Card A — Roles & hotel-manager assignments */}
      <form
        onSubmit={onSubmitRoles}
        className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Roles & hotel assignments</h2>
          <p className="text-sm text-muted-foreground">
            Roles bundle permissions; assigning <span className="font-mono text-xs">hotel-manager</span> lets
            you scope this user to specific hotels.
          </p>
        </div>

        {isLastSuperadmin ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" />
            <span>
              This is the last superadmin. Removing the role will fail server-side.
            </span>
          </div>
        ) : null}

        {errorA ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {errorA}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Roles</span>
          {!allRoles ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {allRoles.map((role) => {
                const isOn = selectedRoles.includes(role.name);
                const disableSuperadminUncheck =
                  role.name === SUPERADMIN_ROLE && cannotUncheckSuperadmin && isOn;
                return (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={isOn}
                      onCheckedChange={(c) => toggleRole(role.name, c === true)}
                      disabled={disableSuperadminUncheck || savingA}
                    />
                    <span className="font-medium">{role.name}</span>
                    {SYSTEM_ROLES.has(role.name) ? (
                      <StatusBadge variant="muted">system</StatusBadge>
                    ) : null}
                    {disableSuperadminUncheck ? (
                      <span className="ml-auto text-xs text-muted-foreground">
                        you can&apos;t self-demote
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}
          {fieldErrorsA["roles"] || fieldErrorsA["roles.0"] ? (
            <p className="text-sm text-destructive">
              {(fieldErrorsA["roles"] ?? fieldErrorsA["roles.0"])[0]}
            </p>
          ) : null}
        </div>

        {hotelManagerSelected ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Managed hotels</span>
              <span className="text-xs text-muted-foreground">
                {selectedHotels.length} selected
              </span>
            </div>
            {!allHotels ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : allHotels.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-background p-3 text-sm text-muted-foreground">
                No hotels available to assign.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {allHotels.map((hotel) => {
                  const isOn = selectedHotels.includes(hotel.id);
                  return (
                    <label
                      key={hotel.id}
                      className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={isOn}
                        onCheckedChange={(c) => toggleHotel(hotel.id, c === true)}
                        disabled={savingA}
                      />
                      <HotelIcon className="size-3.5 text-muted-foreground" />
                      <span>{hotel.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {fieldErrorsA["managed_hotels"] ||
            fieldErrorsA["managed_hotels.0"] ? (
              <p className="text-sm text-destructive">
                {(
                  fieldErrorsA["managed_hotels"] ??
                  fieldErrorsA["managed_hotels.0"]
                )[0]}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!cardADirty || savingA}>
            {savingA ? <Spinner /> : null}
            Save roles
          </Button>
        </div>
      </form>

      {/* Card B — Direct permission grants */}
      <form
        onSubmit={onSubmitPerms}
        className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Direct permission grants</h2>
          <p className="text-sm text-muted-foreground">
            Direct grants stack on top of permissions inherited from this user&apos;s roles. To change role
            permissions, edit the role.
          </p>
        </div>

        {errorB ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {errorB}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Effective permissions</span>
          {(user.permissions?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              This user has no effective permissions.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {roleDerivedPerms.map((p) => (
                <span
                  key={`role-${p}`}
                  className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                  title="Inherited from a role"
                >
                  {p}
                </span>
              ))}
              {(user.direct_permissions ?? []).map((p) => (
                <span
                  key={`direct-${p}`}
                  className="rounded-md bg-amber-500/15 px-2 py-0.5 font-mono text-xs text-amber-700 dark:text-amber-300"
                  title="Direct grant"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Faded chips are inherited from roles; highlighted chips are direct grants.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Direct grants</span>
          {!catalogue ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <PermissionPicker
              catalogue={catalogue}
              value={directPerms}
              onChange={setDirectPerms}
              disabled={savingB}
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!cardBDirty || savingB}>
            {savingB ? <Spinner /> : null}
            Save direct permissions
          </Button>
        </div>
      </form>
    </div>
  );
}
