
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, CurrentUser } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, orgName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  switchOrganization: (orgId: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    localStorage.getItem('easyup_last_org_id')
  );

  // Load session from Supabase on mount
  useEffect(() => {
    let isInitialLoad = true;

    // Listen for auth state changes (this handles initial session load too)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle INITIAL_SESSION (on page load/refresh)
      if (event === 'INITIAL_SESSION') {
        isInitialLoad = false;
        if (session?.user) {
          try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
              setState({
                user: currentUser,
                isAuthenticated: true,
                isLoading: false
              });
            } else {
              setState({ user: null, isAuthenticated: false, isLoading: false });
            }
          } catch (error) {
            console.error('Failed to load user session:', error);
            setState({ user: null, isAuthenticated: false, isLoading: false });
          }
        } else {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
      // Handle SIGNED_IN (after login/register, but NOT on initial load)
      else if (event === 'SIGNED_IN' && !isInitialLoad) {
        if (session?.user) {
          try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
              setState({
                user: currentUser,
                isAuthenticated: true,
                isLoading: false
              });
            }
          } catch (error) {
            console.error('Failed to load user after sign in:', error);
            setState({ user: null, isAuthenticated: false, isLoading: false });
          }
        }
      }
      // Handle SIGNED_OUT
      else if (event === 'SIGNED_OUT') {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle Org Switch Effect
  useEffect(() => {
    const switchOrg = async () => {
      if (state.user && selectedOrgId && state.user.currentOrganization?.id !== selectedOrgId) {
        try {
          // Refresh user with new selected org
          const updatedUser = await authService.getCurrentUser();
          if (updatedUser) {
            setState(prev => ({ ...prev, user: updatedUser }));
          }
        } catch (error) {
          console.error('Error switching organization:', error);
        }
      }
    };

    switchOrg();
  }, [selectedOrgId]);

  const login = async (email: string, password: string) => {
    try {
      const currentUser = await authService.login(email, password);
      setState({ user: currentUser, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, fullName: string, orgName: string) => {
    try {
      const currentUser = await authService.register(email, password, fullName, orgName);
      setState({ user: currentUser, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem('easyup_last_org_id');
      setState({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  };

  const updatePassword = async (password: string) => {
    try {
      await authService.updatePassword(password);
    } catch (error: any) {
      throw new Error(error.message || 'Password update failed');
    }
  };

  const switchOrganization = (orgId: string) => {
    localStorage.setItem('easyup_last_org_id', orgId);
    setSelectedOrgId(orgId);
  };

  const refreshProfile = async () => {
    if (state.user) {
      try {
        const updatedUser = await authService.getCurrentUser();
        if (updatedUser) {
          setState(prev => ({ ...prev, user: updatedUser }));
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      resetPassword,
      updatePassword,
      switchOrganization,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
