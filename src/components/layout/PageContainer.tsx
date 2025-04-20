interface PageContainerProps {
  children: React.ReactNode
  title: string
}

export function PageContainer({ children, title }: PageContainerProps) {
  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {children}
    </div>
  )
}