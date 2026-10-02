import Image from 'next/image';
import { SiteConfig } from '@/lib/config';
import { GithubIcon, InstagramIcon, LinkedinIcon, MailIcon, ScholarIcon, XIcon } from '@/components/Icons';

export default function SiteHeader({ config }: { config: SiteConfig }) {
    const { author, social } = config;

    const links = [
        social.email && { label: 'Email', href: `mailto:${social.email}`, Icon: MailIcon },
        social.google_scholar && { label: 'Google Scholar', href: social.google_scholar, Icon: ScholarIcon },
        social.github && { label: 'GitHub', href: social.github, Icon: GithubIcon },
        social.twitter && { label: 'X', href: social.twitter, Icon: XIcon },
        social.linkedin && { label: 'LinkedIn', href: social.linkedin, Icon: LinkedinIcon },
        social.instagram && { label: 'Instagram', href: social.instagram, Icon: InstagramIcon },
    ].filter(Boolean) as { label: string; href: string; Icon: React.ComponentType<{ className?: string }> }[];

    return (
        <header className="flex items-center gap-5 pt-10 pb-7 sm:gap-7 sm:pt-12 sm:pb-8">
            <div className="shrink-0 rounded-full p-1 ring-1 ring-line">
                <Image
                    src={author.avatar}
                    alt={author.name}
                    width={160}
                    height={160}
                    priority
                    className="h-24 w-24 rounded-full object-cover sm:h-36 sm:w-36"
                />
            </div>

            <div className="min-w-0">
                <h1 className="font-serif text-[1.8rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.4rem]">
                    {author.name}
                </h1>
                <p className="mt-1 text-[0.9rem] text-muted sm:text-[0.95rem]">{author.title}</p>
                <p className="mt-0.5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-crimson sm:text-[0.8rem]">
                    {author.institution}
                </p>

                <nav aria-label="Social links" className="mt-3 flex flex-wrap gap-1 sm:mt-4 sm:gap-2">
                    {links.map(({ label, href, Icon }) => (
                        <a
                            key={label}
                            href={href}
                            target={href.startsWith('mailto:') ? undefined : '_blank'}
                            rel="noopener noreferrer"
                            aria-label={label}
                            title={label}
                            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-crimson hover:text-crimson sm:h-9 sm:w-9"
                        >
                            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </a>
                    ))}
                </nav>
            </div>
        </header>
    );
}
