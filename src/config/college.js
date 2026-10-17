// ─────────────────────────────────────────────────────────────
// College branding. Change these to your own college's details.
//
// Photos: put your own college photos in /public/images/ and
// change the paths below, e.g. campus: '/images/campus.jpg'.
// If a photo cannot load, the portal falls back to the navy theme.
// ─────────────────────────────────────────────────────────────
const college = {
  name: 'ClassOptima Institute of Technology',
  shortName: 'COIT',
  tagline: 'Affiliated to Savitribai Phule Pune University',
  city: 'Pune',
  images: {
    // Main campus building (login page and admin dashboard)
    campus: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1800&q=70',
    // Classroom (professor dashboard)
    classroom: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1800&q=70',
    // Students / lecture hall (student dashboard)
    students: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1800&q=70',
  },
};

export default college;
