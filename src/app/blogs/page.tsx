import RedirectTo from '@/components/RedirectTo';

// The list of posts is the Blogs view of the home page. This address only forwards there,
// so links to /blogs/ (for example from the RSS feed) keep working.
export default function BlogsIndexRedirect() {
    return <RedirectTo to="/#blogs" label="Go to Blogs" className="b-empty" />;
}
