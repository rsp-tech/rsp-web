import {
  BookOpen,
  Calendar,
  GraduationCap,
  Heart,
  HeartHandshake,
  Info,
  type LucideIcon,
  Mail,
  Video,
} from "lucide-react";
import Link from "next/link";
import { FEATURE_FLAGS } from "@/constants";
import { useFeatureFlag } from "@/hooks/use-feature-flags";
import { cn } from "@/lib/utils";

const navLinks: {
  href: string;
  Icon: LucideIcon;
  iconColorClass?: string;
  title: string;
}[] = [
  {
    href: "/videos",
    Icon: Video,
    title: "Videos",
  },
  {
    href: "https://voicepublication.in/search?attribute_Author=Radheshyam+Das",
    Icon: BookOpen,
    title: "Books",
  },
  {
    href: "/about",
    Icon: Info,
    title: "About",
  },
  {
    href: "/contact-us",
    Icon: Mail,
    title: "Contact us",
  },
  {
    href: "http://cvms.radheshyamdas.com/",
    Icon: Heart,
    iconColorClass: "text-destructive",
    title: "Donate",
  },
  {
    href: "https://courses.radheshyamdas.com/",
    Icon: GraduationCap,
    title: "Online certified course",
  },
  {
    href: "https://drive.google.com/drive/u/7/folders/16O9qZXeWSruSU3YyYhnpZkCsmIHtIf6s",
    Icon: Calendar,
    title: "Calendar",
  },
  {
    href: "/get-involved",
    Icon: HeartHandshake,
    iconColorClass: "text-destructive",
    title: "Get Involved",
  },
];

interface NavLinksProps {
  onItemClick?: () => void;
}

export const NavLinks = ({ onItemClick }: NavLinksProps) => {
  const showVideos = useFeatureFlag(FEATURE_FLAGS.VIDEOS);
  return navLinks.map(({ href, Icon, iconColorClass, title }) => (
    <Link
      key={href}
      href={href}
      className="hover:text-primary transition-all flex items-center gap-1.5"
      style={!showVideos && href === "/videos" ? { display: "none" } : {}}
      aria-label={title}
      prefetch={false}
      onClick={onItemClick}
      {...(href.startsWith("http")
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      <Icon className={cn("w-4 h-4", iconColorClass)} />
      <span>{title}</span>
    </Link>
  ));
};
