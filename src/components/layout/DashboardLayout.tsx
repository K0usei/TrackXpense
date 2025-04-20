'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Menu,
    LayoutDashboard,
    BarChart2,
    Camera,
    MessageSquare,
    Wallet,
    Bell,
    User,
    Settings,
    Image as ImageIcon,
    LogOut,
    Sun,
    Moon,
    Receipt,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Logo } from "@/components/ui/logo"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface DashboardLayoutProps {
    children: React.ReactNode
}

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Only show theme toggle after component is mounted on client
    // This prevents hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        // Return a placeholder with the same dimensions to prevent layout shift
        return (
            <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
                disabled
            >
                <div className="h-6 w-6" />
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-foreground"
        >
            {theme === 'dark' ? (
                <Sun className="h-6 w-6" />
            ) : (
                <Moon className="h-6 w-6" />
            )}
        </Button>
    )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const { user, signOut } = useAuth()
    const { theme, setTheme } = useTheme()

    // Check if current page is scanner
    const isScanner = pathname === '/scanner'

    const handleNotificationsClick = () => {
        setOpen(false) // Close the sheet when clicking notification
        toast({
            title: "Notifications",
            description: "Notifications feature coming soon!",
        })
    }

    const handleSignOut = async () => {
        try {
            await signOut()
            router.push('/auth')
            toast({
                title: "Success",
                description: "Successfully signed out",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to sign out",
                variant: "destructive",
            })
        }
    }

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/reports/activity', label: 'Activity Report', icon: BarChart2 },
        { href: '/scanner', label: 'Receipt Scanner', icon: Camera },
        { href: '/assistant', label: 'AI Chatbot', icon: MessageSquare },
        { href: '/reports/budget', label: 'Budget Report', icon: Wallet },
    ]

    const userNavItems = [
        { href: '/profile-settings', label: 'Profile Settings', icon: User },
        { href: '/receipts', label: 'Receipt Gallery', icon: ImageIcon },
    ]

    const NavLink = ({ href, label, icon: Icon, onClick }: any) => {
        const isActive = pathname === href
        return (
            <Link
                href={href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    "hover:bg-blue-500/15",
                    isActive && "bg-blue-500/15"
                )}
                onClick={onClick}
            >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
            </Link>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between p-3 sm:p-4 border-b">
                <Link href="/dashboard" className="text-xl">
                    <Logo size="sm" className="sm:text-xl" />
                </Link>

                <div className="flex items-center gap-1 sm:gap-2">
                    <ThemeToggle />
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-foreground hover:text-blue-500 h-9 w-9 sm:h-10 sm:w-10"
                            >
                                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader className="border-b pb-4">
                                <SheetTitle>
                                    <div className="flex items-center space-x-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                                            <AvatarFallback className="text-blue-500">{user?.displayName?.[0] || user?.email?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1 overflow-hidden max-w-[200px]">
                                            <h2 className="text-base font-semibold text-foreground truncate">
                                                {user?.displayName || user?.email}
                                            </h2>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>
                            <nav className="py-4">
                                {userNavItems.map((item) => (
                                    <NavLink key={item.href} {...item} onClick={() => setOpen(false)} />
                                ))}
                                <button
                                    onClick={handleNotificationsClick}
                                    className="flex w-full items-center gap-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-md"
                                >
                                    <Bell className="h-5 w-5" />
                                    <span className="font-medium">Notifications</span>
                                </button>
                                <Separator className="my-2" />
                                <button
                                    onClick={() => {
                                        handleSignOut()
                                        setOpen(false)
                                    }}
                                    className="flex w-full items-center gap-3 px-3 py-2 hover:bg-accent rounded-md text-destructive hover:text-destructive"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

            {/* Desktop Layout */}
            <div className="hidden lg:flex flex-col h-screen">
                {/* Desktop Header */}
                <header className="border-b">
                    <div className="flex items-center justify-between px-4 py-3 xl:px-6 xl:py-4">
                        <Link href="/dashboard" className="text-xl">
                            <Logo size="md" />
                        </Link>
                        <ThemeToggle />
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar */}
                    <aside className="w-56 xl:w-64 border-r overflow-y-auto">
                        <nav className="space-y-1 p-3 xl:p-4">
                            {navItems.map((item) => (
                                <NavLink key={item.href} {...item} />
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto">
                        <div className="p-4 xl:p-6">
                            {children}
                        </div>
                    </main>

                    {/* Right Sidebar - hide on scanner page */}
                    {pathname !== '/scanner' && (
                        <aside className="w-64 border-l overflow-y-auto">
                            <div className="p-4">
                                <div className="flex items-center space-x-3 mb-6">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                                        <AvatarFallback>{user?.displayName?.[0] || user?.email?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden max-w-[180px]">
                                        <p className="font-medium text-sm truncate">{user?.displayName || user?.email}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <nav className="space-y-1">
                                    {userNavItems.map((item) => (
                                        <NavLink key={item.href} {...item} />
                                    ))}
                                    <button
                                        onClick={handleNotificationsClick}
                                        className="flex w-full items-center gap-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-md"
                                    >
                                        <Bell className="h-5 w-5" />
                                        <span className="font-medium">Notifications</span>
                                    </button>
                                    <Separator className="my-2" />
                                    <button
                                        onClick={handleSignOut}
                                        className="flex w-full items-center gap-3 px-3 py-2 hover:bg-accent rounded-md text-destructive hover:text-destructive"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span className="font-medium">Logout</span>
                                    </button>
                                </nav>
                            </div>
                        </aside>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Navigation - Hide on scanner page */}
            {!isScanner && (
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
                    <div className="flex justify-around p-1 sm:p-2">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "p-2 text-foreground transition-colors flex flex-col items-center",
                                        isActive ? "text-blue-500" : "hover:text-blue-500"
                                    )}
                                    aria-label={item.label}
                                >
                                    <Icon className="h-6 w-6" />
                                    <span className="hidden sm:block text-xs mt-0.5">{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            )}

            {/* Mobile Content - Adjust margin only when navbar is visible */}
            <div className={cn(
                "lg:hidden flex-1 container mx-auto p-3 sm:p-4",
                !isScanner && "mb-20 sm:mb-24"
            )}>
                {children}
            </div>
        </div>
    )
}












