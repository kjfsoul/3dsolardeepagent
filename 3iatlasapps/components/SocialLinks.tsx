type Brand = "mysticArcana" | "edmShuffle" | "birthdayGen";
const LINKS: Record<Brand, { label: string; href: string }[]> = {
  mysticArcana: [
    { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61573772402958#" },
    { label: "Instagram", href: "https://www.instagram.com/mysticarcanaofficial/" },
    { label: "X", href: "https://x.com/arcana86042" },
    { label: "TikTok", href: "https://www.tiktok.com/@the_mystic_arcana" },
    { label: "YouTube", href: "https://www.youtube.com/channel/UCAgx73UXA4oCZ85upjwzGhA" },
  ],
  edmShuffle: [
    { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61573689124563" },
    { label: "Instagram", href: "https://www.instagram.com/edmshuffleofficial/" },
    { label: "X", href: "https://x.com/edm_shuffle" },
    { label: "TikTok", href: "https://www.tiktok.com/@edmshuffleofficial?lang=en" },
    { label: "YouTube", href: "https://www.youtube.com/channel/UCCwIeASGfF70IU7KYFWInqA" },
  ],
  birthdayGen: [
    { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61573805004280" },
    { label: "TikTok", href: "https://www.tiktok.com/@birthdaygen?lang=en" },
    { label: "Instagram", href: "https://www.instagram.com/birthday_gen/" },
    { label: "X", href: "https://x.com/BirthdayGen" },
    { label: "YouTube", href: "https://www.youtube.com/@BirthdayGen" },
  ],
};
export default function SocialLinks({ brand }: { brand: Brand }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {LINKS[brand].map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noopener" aria-label={`${brand} on ${l.label}`}
           className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/90 hover:bg-white/20">
          {l.label}
        </a>
      ))}
    </div>
  );
}
