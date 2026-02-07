import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface PageTransitionProps {
  activeKey: string;
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ activeKey, children }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
