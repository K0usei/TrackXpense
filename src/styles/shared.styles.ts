export const sharedStyles = {
  grid: {
    stats: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
  },
  cardBase: "relative overflow-hidden",
  cardGradient: {
    violet: "bg-gradient-to-br from-violet-50/50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-800/20",
    cyan: "bg-gradient-to-br from-cyan-50/50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/20",
    teal: "bg-gradient-to-br from-teal-50/50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-800/20",
    lime: "bg-gradient-to-br from-lime-50/50 to-lime-100/50 dark:from-lime-900/20 dark:to-lime-800/20"
  }
} as const
