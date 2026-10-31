// Fill these two in after creating the Supabase project (see README.md).
// Both values are safe to publish, access is controlled by the row level
// security rules in supabase/schema.sql.
export const config = {
  supabaseUrl: 'https://jmlpsfvuqjwfhejvduyn.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbHBzZnZ1cWp3ZmhlanZkdXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNTk4MTksImV4cCI6MjEwODkzNTgxOX0.-Ik8snOmzOrOMgowcXi7hX0qTQw-PN7GYjNLeXRAzME',

  emailDomain: 'iitdh.ac.in',
  clubName: 'Electronics Club IITDh',
  college: 'IIT Dharwad',

  // shown on the join page and in the footer, leave empty to hide
  contactEmail: 'electronicsclub@iitdh.ac.in',
  instagram: '',
  github: '',

  // only used by the offline preview, the real admin comes from the database
  previewAdmin: 'ee23bt041@iitdh.ac.in',
};

export const isLive = Boolean(config.supabaseUrl && config.supabaseKey);
