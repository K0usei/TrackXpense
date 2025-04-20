import { motion } from "framer-motion"
import { Icons } from "./icons"

export function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Icons.spinner className="h-8 w-8 text-primary" />
      </motion.div>
      <span className="ml-2 text-lg font-medium">Loading...</span>
    </motion.div>
  )
}