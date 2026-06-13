"use client";

import {
  BookOpen,
  Briefcase,
  Calendar,
  GraduationCap,
  Heart,
  Info,
  Mail,
} from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card text-card-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <span className="font-bold text-base tracking-tight text-foreground">
            HG Radheshyamdas Spiritual Discourses
          </span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Radheshyamdas.com. All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-muted-foreground">
          <a
            href="https://voicepublication.in/search?attribute_Author=Radheshyam+Das"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Books</span>
          </a>
          <Link
            href="/about"
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </Link>
          <Link
            href="/contact"
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Mail className="w-4 h-4" />
            <span>Contact us</span>
          </Link>
          <a
            href="http://cvms.radheshyamdas.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Donate</span>
          </a>
          <a
            href="https://courses.radheshyamdas.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Online certified course</span>
          </a>
          <a
            href="https://drive.google.com/drive/u/7/folders/16O9qZXeWSruSU3YyYhnpZkCsmIHtIf6s"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </a>
          <Link
            href="/services"
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Briefcase className="w-4 h-4" />
            <span>Services</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
