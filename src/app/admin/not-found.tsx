import Link from "next/link"

export default function ManageNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">This page doesn&apos;t exist.</p>
      <Link href="/manage/dashboard" className="text-sm text-primary underline underline-offset-4">
        Back to Dashboard
      </Link>
    </div>
  )
}
