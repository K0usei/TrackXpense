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
    Image as ImageIcon,
    LogOut,
} from 'lucide-react'
import { NotificationsList } from '@/components/notifications/notifications-list'
import { fetchNotifications } from '@/lib/services/notification-service'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Logo } from "@/components/ui/logo"
import { useAuth } from "@/contexts/AuthContext"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ThemeToggle } from '@/components/theme-toggle'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const { user, signOut } = useAuth()

    const [showNotifications, setShowNotifications] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    // Check if current page is scanner or assistant
    const isScanner = pathname === '/scanner'
    const isAssistant = pathname === '/assistant'

    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
        if (user) {
            try {
                const notifications = await fetchNotifications()
                const unread = notifications.filter(n => !n.read).length
                setUnreadCount(unread)
            } catch (error) {
                console.error('Error fetching notifications:', error)
                // Don't show error toast to avoid spamming the user
                setUnreadCount(0)
            }
        } else {
            // Reset unread count if user is not logged in
            setUnreadCount(0)
        }
    }

    // Fetch notifications count on mount and when user changes
    useEffect(() => {
        fetchUnreadCount()
    }, [user])

    // Refresh notifications count when the dialog is closed
    const handleNotificationsDialogChange = (open: boolean) => {
        setShowNotifications(open)
        if (!open) {
            // Refresh the count when the dialog is closed
            fetchUnreadCount()
        }
    }

    const handleNotificationsClick = () => {
        setShowNotifications(true)
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
            {/* Mobile Header - Fixed at top - Hide on scanner page */}
            {!isScanner && (
                <header className="lg:hidden fixed top-0 left-0 right-0 flex items-center justify-between p-3 sm:p-4 border-b bg-background z-50">
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
                                        onClick={() => {
                                            handleNotificationsClick()
                                            setOpen(false)
                                        }}
                                        className="flex w-full items-center gap-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-md relative"
                                    >
                                        <Bell className="h-5 w-5" />
                                        <span className="font-medium">Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
                                                {unreadCount}
                                            </span>
                                        )}
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
            )}

            {/* Desktop Layout */}
            <div className="hidden lg:flex flex-col h-screen">
                {/* Desktop Header - Sticky - Hide on scanner page */}
                {!isScanner && (
                    <header className="border-b sticky top-0 bg-background z-50">
                        <div className="flex items-center justify-between px-4 py-3 xl:px-6 xl:py-4">
                            <Link href="/dashboard" className="text-xl">
                                <Logo size="md" />
                            </Link>
                            <ThemeToggle />
                        </div>
                    </header>
                )}

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Sticky */}
                    <aside className={cn(
                        "w-56 xl:w-64 border-r overflow-y-auto sticky",
                        isScanner || isAssistant ? "top-0 max-h-screen" : "top-[57px] max-h-[calc(100vh-57px)]"
                    )}>
                        <nav className="space-y-1 p-3 xl:p-4">
                            {navItems.map((item) => (
                                <NavLink key={item.href} {...item} />
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className={cn(
                        "flex-1",
                        !isAssistant && "overflow-y-auto"
                    )}>
                        <div className={cn(
                            isAssistant ? "p-0" : "p-4 xl:p-6"
                        )}>
                            {children}
                        </div>
                    </main>

                    {/* Right Sidebar - hide on scanner page - Sticky */}
                    {pathname !== '/scanner' && (
                        <aside className={cn(
                            "w-64 border-l overflow-y-auto sticky",
                            isScanner ? "top-0 max-h-screen" : "top-[57px] max-h-[calc(100vh-57px)]"
                        )}>
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
                                        className="flex w-full items-center gap-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-md relative"
                                    >
                                        <Bell className="h-5 w-5" />
                                        <span className="font-medium">Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
                                                {unreadCount}
                                            </span>
                                        )}
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

            {/* Mobile Content - Adjust margin for fixed header and bottom navbar */}
            <div className={cn(
                "lg:hidden flex-1 container mx-auto p-3 sm:p-4",
                !isScanner ? "mt-16 sm:mt-20" : "mt-0", // Add top margin for fixed header only when not on scanner page
                !isScanner && "mb-20 sm:mb-24" // Add bottom margin for bottom navbar
            )}>
                {children}
            </div>

            {/* Notifications Dialog */}
            <Dialog open={showNotifications} onOpenChange={handleNotificationsDialogChange}>
                <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Notifications</DialogTitle>
                    </DialogHeader>
                    <NotificationsList />
                </DialogContent>
            </Dialog>
        </div>
    )
}












