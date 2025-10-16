import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

type Photo = {
  id: string;
  photo_url: string;
  caption: string | null;
  sort_order: number | null;
};

type Property = {
  id: string;
  name: string;
  property_type: string;
  description?: string | null;
  city: string;
  state: string;
  status: string | null;
  created_at: string;
  property_photos?: Photo[];
};

const Home = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [heroApi, setHeroApi] = useState<any>(null);
  const [heroCurrent, setHeroCurrent] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPublished = async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          property_photos (
            id,
            photo_url,
            caption,
            sort_order
          )
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(24);

      if (!error) setProperties(data || []);
      setLoading(false);
    };
    fetchPublished();
  }, []);

  // Autoplay for hero carousel
  useEffect(() => {
    if (!heroApi) return;
    const onSelect = () => setHeroCurrent(heroApi.selectedScrollSnap());
    heroApi.on("select", onSelect);
    onSelect();
    const interval = setInterval(() => {
      try {
        heroApi.scrollNext();
      } catch {}
    }, 4000);
    return () => {
      clearInterval(interval);
      heroApi.off?.("select", onSelect);
    };
  }, [heroApi]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src="/weinn-logo.png" alt="Logo" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/')} />
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="outline" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12 overflow-hidden rounded-2xl border bg-card">
          <div className="relative w-full">
            <Carousel
              setApi={setHeroApi}
              className="w-full"
              opts={{ align: "start", loop: true }}
            >
              <CarouselContent>
                {[0,1,2,3,4].map((i) => (
                  <CarouselItem key={i}>
                    <div
                      className="relative w-full h-[60vh] md:h-[70vh] lg:h-[70vh]"
                    >
                      <img
                        src={heroImage}
                        alt="Weinn hero"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/45" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Overlay content */}
            <div className="pointer-events-none absolute inset-0 flex items-center">
              <div className="w-full px-6 md:px-12">
                <div className="max-w-3xl text-white">
                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                    List your property with confidence
                  </h1>
                  <p className="mt-4 text-white/90 text-base md:text-lg leading-relaxed">
                    Join a growing network of hotels, villas and homestays.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 pointer-events-auto">
                    <Button
                      variant="hero"
                      size="lg"
                      onClick={() => navigate("/list-property")}
                      className="sm:w-auto"
                    >
                      List your property
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => window.scrollTo({ top: document.body.scrollHeight / 4, behavior: 'smooth' })}
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20 sm:w-auto"
                    >
                      Browse published properties
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dots Indicators */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-auto">
              {[0,1,2,3,4].map((i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => heroApi?.scrollTo(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    heroCurrent === i ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Explore Published Properties</h1>
          <p className="text-muted-foreground">A growing list of properties submitted by owners.</p>
          <div className="mt-3">
            <Badge variant="secondary">{properties.length} properties</Badge>
          </div>
        </div>

        {properties.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <h3 className="text-2xl font-semibold mb-2">No published properties yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to list a property.</p>
              <Button variant="gradient" size="lg" onClick={() => navigate("/list-property")}>
                List Your Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => {
              const cover = [...(p.property_photos || [])]
                .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))[0];
              return (
                <Card
                  key={p.id}
                  className="hover:shadow-[var(--shadow-elegant)] transition-[var(--transition-smooth)] cursor-pointer rounded-2xl overflow-hidden"
                  onClick={() => navigate(`/property/${p.id}`)}
                >
                  {cover && (
                    <div className="w-full h-44 overflow-hidden">
                      <img src={cover.photo_url} alt={cover.caption || p.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{p.name}</CardTitle>
                        <CardDescription className="mt-1">{p.city}, {p.state}</CardDescription>
                      </div>
                      {/* Status badge hidden on public home listings */}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {(p.description?.trim()?.length ?? 0) > 0
                        ? `${p.description!.trim()!.slice(0, 140)}${(p.description!.trim()!.length > 140 ? '…' : '')}`
                        : ''}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

