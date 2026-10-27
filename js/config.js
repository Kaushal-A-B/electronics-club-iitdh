// Fill these two in after creating the Supabase project (see README.md).
// Both values are safe to publish, access is controlled by the row level
// security rules in supabase/schema.sql.
export const config = {
  supabaseUrl: '',
  supabaseKey: '',

  emailDomain: 'iitdh.ac.in',
  clubName: 'Electronics Club',
  college: 'IIT Dharwad',

  // shown on the join page and in the footer, leave empty to hide
  contactEmail: '',
  instagram: '',
  github: '',

  // only used by the offline preview, the real admin comes from the database
  previewAdmin: 'ee23bt041@iitdh.ac.in',
};

export const isLive = Boolean(config.supabaseUrl && config.supabaseKey);
