## Map media
- Keep the farm photo gallery separate from geographic map layers and reference uploaded photos through Lovable Assets pointers, so photos do not imply georeferenced imagery or enlarge the source repository.

## Application navigation
- Use one responsive application shell for all authenticated routes, with module definitions in a shared registry and internal submodule links, so phone and desktop users can access the same functionality.
- Preserve legacy /mobile links as redirects to canonical routes, so saved links do not retain a separate limited mobile experience.
- Implement brand styling through semantic CSS tokens and shared UI primitives, so visual changes remain consistent across existing management pages.
- Keep route transitions mounted outside route content and gate their reveal on active first-load query readiness with a bounded timeout, so destination pages load behind the animation without cached refreshes or failed requests trapping navigation.