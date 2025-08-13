import React, {createContext, useContext, useEffect, useState} from 'react';
import auth, {AuthState} from '../services/auth';
import {SupportedOIDCIssuer} from '../services/api';

interface AuthContextType {
    authState: AuthState;
    loginWithOAuth2Provider: (provider: SupportedOIDCIssuer, redirectPath?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [authState, setAuthState] = useState<AuthState>(auth.getState());

    useEffect(() => {
        const unsubscribe = auth.subscribe(setAuthState);
        return unsubscribe;
    }, []);

    const loginWithOAuth2Provider = async (provider: SupportedOIDCIssuer, redirectPath?: string) => {
        try {
            await auth.loginWithOAuth2Provider(provider, redirectPath);
        } catch (error) {
            console.error('OAuth2 login failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            console.log("logout triggered")
            await auth.logout();
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    };

    const refreshAuthState = async () => {
        try {
            console.log('Refresh auth state:');
            await auth.initialize();
        } catch (error) {
            console.error('Failed to refresh auth state:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            authState,
            loginWithOAuth2Provider,
            logout,
            refreshAuthState
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;