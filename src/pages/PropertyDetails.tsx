import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Users, 
  Bed, 
  Wifi, 
  Car, 
  Coffee, 
  Dumbbell, 
  Waves, 
  Utensils, 
  Clock, 
  Shield, 
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Plus,
  Heart,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface PropertyDetails {
  id: string;
  name: string;
  property_type: string;
  description: string;
  street_address: string;
  city: string;
  state: string;
  amenities: Record<string, string[]>;
  checkin_time: string;
  checkout_time: string;
  cancellation_policy: string;
  status: string;
  created_at: string;
  updated_at: string;
  photos: Array<{
    id: string;
    photo_url: string;
    caption: string | null;
    sort_order: number;
  }>;
  rooms: Array<{
    id: string;
    room_type: string;
    bed_type: string;
    max_guests: number;
    units_available: number;
    facilities: string[];
    price_lkr: number;
    photos: Array<{
      id: string;
      photo_url: string;
      caption: string | null;
      sort_order: number;
    }>;
  }>;
}

// Helper function to convert Json to string array
const jsonToStringArray = (json: Json | null): string[] => {
  if (!json) return [];
  if (Array.isArray(json)) {
    return json.filter((item): item is string => typeof item === 'string');
  }
  if (typeof json === 'string') {
    return [json];
  }
  return [];
};

// Helper function to convert Json to amenities object
const jsonToAmenities = (json: Json | null): Record<string, string[]> => {
  if (!json || typeof json !== 'object' || json === null) return {};
  if (Array.isArray(json)) return {};
  
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(json)) {
    if (Array.isArray(value)) {
      result[key] = value.filter((item): item is string => typeof item === 'string');
    } else if (typeof value === 'string') {
      result[key] = [value];
    }
  }
  return result;
};

// Helper function to get all amenities as a flat array with category info
const getAllAmenities = (amenities: Record<string, string[]>): Array<{category: string, amenity: string}> => {
  const allAmenities: Array<{category: string, amenity: string}> = [];
  for (const [category, amenityList] of Object.entries(amenities)) {
    for (const amenity of amenityList) {
      allAmenities.push({ category, amenity });
    }
  }
  return allAmenities;
};

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<PropertyDetails['rooms'][0] | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryCarouselApi, setGalleryCarouselApi] = useState<any>(null);
  const [galleryCurrentSlide, setGalleryCurrentSlide] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchPropertyDetails();
    }
  }, [id, user]);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);
    onSelect();

    return () => carouselApi.off("select", onSelect);
  }, [carouselApi]);

  useEffect(() => {
    if (!galleryCarouselApi) return;

    const onSelect = () => {
      setGalleryCurrentSlide(galleryCarouselApi.selectedScrollSnap());
    };

    galleryCarouselApi.on("select", onSelect);
    onSelect();

    return () => galleryCarouselApi.off("select", onSelect);
  }, [galleryCarouselApi]);

  const fetchPropertyDetails = async () => {
    try {
      // Fetch property with photos
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          *,
          property_photos (
            id,
            photo_url,
            caption,
            sort_order
          )
        `)
        .eq('id', id)
        .single();

      if (propertyError) throw propertyError;

      // Fetch rooms with their photos
      const { data: roomsData, error: roomsError } = await supabase
        .from('property_rooms')
        .select(`
          *,
          room_photos (
            id,
            photo_url,
            caption,
            sort_order
          )
        `)
        .eq('property_id', id)
        .order('created_at');

      if (roomsError) throw roomsError;

      // Combine the data
      const { amenities, property_photos, ...propertyDataWithoutJson } = propertyData!;
      const propertyWithRooms: PropertyDetails = {
        ...propertyDataWithoutJson,
        amenities: jsonToAmenities(amenities),
        photos: property_photos || [],
        rooms: (roomsData || []).map(room => {
          const { facilities, room_photos, ...roomData } = room;
          return {
            ...roomData,
            facilities: jsonToStringArray(facilities),
            photos: room_photos || []
          };
        })
      } as PropertyDetails;

      setProperty(propertyWithRooms);
    } catch (error: any) {
      console.error('Error fetching property details:', error);
      toast({
        title: "Error",
        description: "Failed to load property details. Please try again.",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Not specified';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) return <Wifi className="h-4 w-4" />;
    if (lowerAmenity.includes('parking')) return <Car className="h-4 w-4" />;
    if (lowerAmenity.includes('restaurant') || lowerAmenity.includes('dining') || lowerAmenity.includes('breakfast')) return <Utensils className="h-4 w-4" />;
    if (lowerAmenity.includes('fitness') || lowerAmenity.includes('gym')) return <Dumbbell className="h-4 w-4" />;
    if (lowerAmenity.includes('pool') || lowerAmenity.includes('swimming')) return <Waves className="h-4 w-4" />;
    if (lowerAmenity.includes('coffee') || lowerAmenity.includes('bar')) return <Coffee className="h-4 w-4" />;
    return <Star className="h-4 w-4" />;
  };


  const handleRoomClick = (room: PropertyDetails['rooms'][0]) => {
    setSelectedRoom(room);
    setShowRoomModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Property Not Found</h2>
          <p className="text-muted-foreground mb-4">The property you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/weinn-logo.png" alt="Logo" className="h-8 w-auto" />
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-[160px] py-8 max-w-7xl">
        <div className="w-full">
          {/* Property Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
              <div className="flex-1 min-w-0">
                {/* Rating Display */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">(not yet rated)</span>
                  </div>
                  
                  {/* Mobile Action Buttons - Inline with rating */}
                  <div className="flex items-center gap-2 md:hidden">
                    <button
                      onClick={() => {
                        toast({
                          title: "Added to Favorites",
                          description: "This property has been saved to your favorites!",
                        });
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Save to Favorites"
                    >
                      <Heart className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: property.name,
                            text: `Check out this property: ${property.name}`,
                            url: window.location.href,
                          });
                        } else {
                          // Fallback for browsers that don't support Web Share API
                          navigator.clipboard.writeText(window.location.href);
                          toast({
                            title: "Link Copied",
                            description: "Property link has been copied to clipboard!",
                          });
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Share Property"
                    >
                      <Share2 className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2 break-words">
                  {property.name}
                </h1>
                <div className="flex items-center text-muted-foreground mb-2">
                  <MapPin className="h-5 w-5 mr-2 flex-shrink-0 hidden md:block" />
                  <span className="text-lg break-words">
                    {property.street_address}, {property.city}, {property.state}
                  </span>
                </div>
              </div>
              
              {/* Desktop Action Buttons */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => {
                    toast({
                      title: "Added to Favorites",
                      description: "This property has been saved to your favorites!",
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Save to Favorites"
                >
                  <Heart className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: property.name,
                        text: `Check out this property: ${property.name}`,
                        url: window.location.href,
                      });
                    } else {
                      // Fallback for browsers that don't support Web Share API
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: "Link Copied",
                        description: "Property link has been copied to clipboard!",
                      });
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Share Property"
                >
                  <Share2 className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          {property.photos.length > 0 && (
            <div className="mb-8">
              {/* Desktop Grid View - Static Layout */}
              <div className="hidden md:block">
                <div className="grid grid-cols-4 gap-2 min-h-[300px] max-h-[500px]">
                  {/* Main Photo */}
                  <div 
                    className="col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-l-lg group relative"
                    onClick={() => {
                      setGalleryCurrentSlide(0);
                      setShowGalleryModal(true);
                    }}
                  >
                    <img
                      src={property.photos[0]?.photo_url}
                      alt={property.photos[0]?.caption || property.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  {/* Thumbnail Photos */}
                  {property.photos.slice(1, 5).map((photo, index) => {
                    const isLastThumbnail = index === 3; // 4th thumbnail (0-indexed)
                    const additionalPhotos = property.photos.length - 5; // Total photos minus the 5 shown
                    const showOverlay = isLastThumbnail && additionalPhotos > 0;
                    
                    return (
                      <div 
                        key={photo.id}
                        className="cursor-pointer overflow-hidden rounded group relative"
                        onClick={() => {
                          setGalleryCurrentSlide(index + 1);
                          setShowGalleryModal(true);
                        }}
                      >
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || `${property.name} photo ${index + 2}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {/* Additional photos overlay */}
                        {showOverlay && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="text-center text-white">
                              <Plus className="h-8 w-8 mx-auto mb-1" />
                              <span className="text-sm font-semibold">
                                +{additionalPhotos} more
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Carousel View */}
              <div className="md:hidden -mx-4">
                <Carousel
                  setApi={setCarouselApi}
                  className="w-full"
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                >
                  <CarouselContent className="-ml-0">
                    {property.photos.map((photo, index) => (
                      <CarouselItem key={photo.id} className="pl-0">
                        <div 
                          className="relative aspect-video cursor-pointer overflow-hidden"
                          onClick={() => {
                            setGalleryCurrentSlide(index);
                            setShowGalleryModal(true);
                          }}
                        >
                          <img
                            src={photo.photo_url}
                            alt={photo.caption || `${property.name} photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Eye className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {property.photos.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2 bg-background/80 backdrop-blur" />
                      <CarouselNext className="right-2 bg-background/80 backdrop-blur" />
                    </>
                  )}
                </Carousel>
                
                {/* Carousel Indicators */}
                {property.photos.length > 1 && (
                  <div className="flex justify-center mt-4 space-x-2 px-4">
                    {property.photos.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentSlide ? 'bg-primary' : 'bg-muted'
                        }`}
                        onClick={() => carouselApi?.scrollTo(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gallery Modal */}
          {showGalleryModal && (
            <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
              <div className="relative w-full max-w-6xl max-h-full">
                {/* Close Button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -top-12 right-0 bg-background/80 backdrop-blur z-10"
                  onClick={() => setShowGalleryModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Gallery Carousel */}
                <Carousel
                  setApi={setGalleryCarouselApi}
                  className="w-full"
                  opts={{
                    align: "center",
                    loop: true,
                    startIndex: galleryCurrentSlide,
                  }}
                >
                  <CarouselContent>
                    {property.photos.map((photo, index) => (
                      <CarouselItem key={photo.id}>
                        <div className="relative">
                          <img
                            src={photo.photo_url}
                            alt={photo.caption || `${property.name} photo ${index + 1}`}
                            className="w-full h-[70vh] object-contain rounded-lg"
                          />
                          {photo.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 rounded-b-lg">
                              <p className="text-sm">{photo.caption}</p>
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  
                  {/* Navigation Arrows */}
                  {property.photos.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4 bg-background/80 backdrop-blur" />
                      <CarouselNext className="right-4 bg-background/80 backdrop-blur" />
                    </>
                  )}
                </Carousel>

                {/* Gallery Indicators */}
                {property.photos.length > 1 && (
                  <div className="flex justify-center mt-6 space-x-2">
                    {property.photos.map((_, index) => (
                      <button
                        key={index}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === galleryCurrentSlide ? 'bg-white' : 'bg-white/50'
                        }`}
                        onClick={() => galleryCarouselApi?.scrollTo(index)}
                      />
                    ))}
                  </div>
                )}

                {/* Image Counter */}
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {galleryCurrentSlide + 1} / {property.photos.length}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-6 lg:space-y-8">
              {/* Description */}
              {property.description && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">About this property</h2>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                        {property.description}
                      </p>
                    </div>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && Object.keys(property.amenities).length > 0 && (() => {
                const allAmenities = getAllAmenities(property.amenities);
                const initialLimit = 6;
                const hasMoreAmenities = allAmenities.length > initialLimit;
                const displayedAmenities = showAllAmenities ? allAmenities : allAmenities.slice(0, initialLimit);
                
                // Group displayed amenities by category
                const groupedAmenities: Record<string, string[]> = {};
                displayedAmenities.forEach(({ category, amenity }) => {
                  if (!groupedAmenities[category]) {
                    groupedAmenities[category] = [];
                  }
                  groupedAmenities[category].push(amenity);
                });

                return (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Property amenities</h2>
                    <div className="space-y-6">
                      {Object.entries(groupedAmenities).map(([category, amenities]) => (
                        amenities.length > 0 && (
                          <div key={category}>
                            <h4 className="font-semibold mb-3">{category}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {amenities.map((amenity) => (
                                <div key={amenity} className="flex items-center space-x-3">
                                  {getAmenityIcon(amenity)}
                                  <span className="text-sm">{amenity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                      
                      {hasMoreAmenities && (
                        <div className="pt-4 border-t">
                          <button
                            onClick={() => setShowAllAmenities(!showAllAmenities)}
                            className="text-primary underline hover:no-underline cursor-pointer"
                          >
                            {showAllAmenities ? 'Show Less' : `See More (${allAmenities.length - initialLimit} more)`}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Sidebar */}
            <div className="space-y-4 lg:space-y-6">
              {/* Special Notice */}
              <div>
                <div className="border border-primary/20 rounded-lg p-6 bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground mb-4">
                      Thank you for partnering with Weinn!
                    </h3>
                    <div className="text-muted-foreground leading-relaxed space-y-3">
                      <p>
                        We're excited to welcome you to our journey of transforming hotel bookings in Sri Lanka. Your property listing and data will be seamlessly integrated into the exclusive Weinn mobile app, launching in early 2026.
                      </p>
                      <p>
                        As one of our early partners, you'll be the first to experience our AI-powered, technology-rich, hassle-free booking management platform—designed and built right here in Sri Lanka to support our nation's hospitality industry with a truly better product.
                      </p>
                      <p>
                        For now, we've collected your basic hotel details, and once the app launches, you'll be able to set up, customize, and update your listing anytime to showcase your property at its very best.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Room Details Modal */}
      <Dialog open={showRoomModal} onOpenChange={setShowRoomModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedRoom?.room_type} - Room Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedRoom && (
            <div className="space-y-6">
              {/* Room Photos Gallery */}
              {selectedRoom.photos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Room Photos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedRoom.photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || `${selectedRoom.room_type} photo`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
                            <p className="text-sm">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Room Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Room Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Bed Type:</span>
                        <span className="ml-2">{selectedRoom.bed_type}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Max Guests:</span>
                        <span className="ml-2">{selectedRoom.max_guests}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Units Available:</span>
                        <span className="ml-2">{selectedRoom.units_available}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pricing</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      LKR {selectedRoom.price_lkr.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">per unit per night</div>
                  </div>
                </div>
              </div>

              {/* Room Facilities */}
              {selectedRoom.facilities.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Room Facilities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedRoom.facilities.map((facility) => (
                      <div key={facility} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    // Add booking logic here
                    toast({
                      title: "Booking Feature",
                      description: "Booking functionality will be implemented soon!",
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Book This Room
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRoomModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetails;
