
// MOCK MODE: Supabase client is disabled.
// All data is handled by lib/mockDb.ts locally.

export const supabase = {
  from: () => {
    console.warn("Supabase is disabled. Use mockDb instead.");
    return {
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ select: () => ({ data: [], error: null }) })
    };
  },
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: {}, error: null }),
    signUp: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null } }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://via.placeholder.com/300' } })
    })
  },
  channel: () => ({
    on: () => ({ on: () => ({ subscribe: () => {} }) }),
    subscribe: () => {},
    unsubscribe: () => {}
  }),
  removeChannel: () => {}
};
