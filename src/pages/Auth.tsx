import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User, Phone } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Sign In Form State
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(signInData.email, signInData.password);
    
    if (!error) {
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signUp(
      signUpData.email, 
      signUpData.password, 
      signUpData.name, 
      signUpData.phoneNumber
    );
    
    if (!error) {
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  };

  const handleFormSwitch = (newForm: boolean) => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsSignUp(newForm);
      setIsAnimating(false);
    }, 150);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center bg-[#2941AF]">
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Desktop Logo */}
          <div className="hidden lg:block text-center mb-8">
            <img src="/weinn-logo.png" alt="WeInn Logo" className="h-12 mx-auto mb-4" />
          </div>
          
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/weinn-logo.png" alt="WeInn Logo" className="h-12 mx-auto mb-4" />
          </div>

          <div className="relative overflow-hidden">
            <div 
              className={`transition-all duration-300 ease-in-out ${
                isAnimating 
                  ? 'opacity-0 transform translate-x-4' 
                  : 'opacity-100 transform translate-x-0'
              }`}
            >
              {!isSignUp ? (
                // Sign In Form
                <Card className="border-0">
                  <CardHeader className="px-0 text-center">
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                      Sign in to manage your properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            value={signInData.email}
                            onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="Enter your password"
                            className="pl-10"
                            value={signInData.password}
                            onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        variant="hero"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </form>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => handleFormSwitch(true)}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign Up
                        </button>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Sign Up Form
                <Card className="border-0">
                  <CardHeader className="px-0 text-center">
                    <CardTitle>Create Your Account</CardTitle>
                    <CardDescription>
                      Join WeInn and start listing your properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Enter your full name"
                            className="pl-10"
                            value={signUpData.name}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            className="pl-10"
                            value={signUpData.phoneNumber}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            value={signUpData.email}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password"
                            className="pl-10"
                            value={signUpData.password}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        variant="hero"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => handleFormSwitch(false)}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign In
                        </button>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;