# Marketing site archive

The previous luxury marketing homepage (`HomePageContent`) is preserved at:

- **Route:** `/marketing-archive` (not indexed)
- **Component:** `src/components/home/HomePageContent.tsx`

To restore it as the public homepage, swap `src/app/page.tsx` to render `HomePageContent` and adjust `AppShell` to use the luxury shell on `/` again.
