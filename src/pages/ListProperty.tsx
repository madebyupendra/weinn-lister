import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Building, MapPin, Home, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

interface PropertyFormData {
  property_type: string;
  name: string;
  description: string;
  street_address: string;
  city: string;
  state: string;
  amenities: Record<string, string[]>;
  rooms: Array<{
    room_type: string;
    bed_type: string;
    max_guests: number;
    units_available: number;
    facilities: string[];
    price_lkr: number;
  }>;
  checkin_time: string;
  checkout_time: string;
  cancellation_policy: string;
  photos: string[]; // Cloudinary URLs
}

const AMENITY_CATEGORIES = {
  'Front Desk & Guest Services': [
    '24-hour front desk', 'Express check-in/check-out', 'Concierge desk', 
    'Baggage storage', 'Tour desk', 'Ticket service', 'Room service'
  ],
  'Accessibility & Convenience': [
    'Elevators', 'ATM on site', 'Currency exchange', 'Secured parking', 
    'Valet parking', 'Indoor/outdoor parking', 'Accessible parking'
  ],
  'Comfort & Utilities': [
    'Air conditioning', 'Heating', 'Safe in room', 'Non-smoking rooms', 
    'Hairdresser/beautician', 'Ironing service', 'Dry cleaning', 'Laundry services'
  ],
  'Dining & Refreshments': [
    'Restaurant', 'Bar', 'Breakfast (buffet or included)', 'Snack bar', 
    'Vending machines (drinks/snacks)'
  ],
  'Leisure & Wellness': [
    'Fitness center', 'Sauna', 'Jacuzzi/hot tub', 'Outdoor/indoor pool', 
    'Turkish/steam bath', 'Solarium'
  ],
  'Family & Entertainment': [
    'Game room', 'Kids\' club', 'Playground', 'Indoor play area', 
    'Evening entertainment', 'Music/DVD library for children', 'Board games/puzzles'
  ],
  'Sport & Outdoor Activities': [
    'Tennis court and equipment', 'Golf course (within 2 miles)', 'Water sports facilities', 
    'Horseback riding', 'Hiking', 'Fishing', 'Diving', 'Canoeing', 'Snorkeling', 
    'Windsurfing', 'Mini golf', 'Table tennis', 'Billiard (on site)'
  ],
  'Room & Miscellaneous Amenities': [
    'Shops (on site)', 'Minimarket', 'Shared kitchen', 'Business center', 
    'Meeting/banquet facilities', 'Bicycle rentals', 'Outdoor furniture', 
    'Garden', 'Terrace', 'Sun terrace', 'Shared lounge/TV area', 'Private beach area or beachfront'
  ]
};

const ROOM_FACILITIES = [
  'Flat-screen TV', 'Free WiFi', 'Air conditioning', 'View', 'Mountain view', 
  'Minibar', 'Ensuite bathroom', 'Cable channels', 'Free toiletries', 'Shower', 
  'Bathrobe', 'Safety deposit box', 'Bidet', 'Toilet', 'Towels', 'Linen', 
  'Socket near the bed', 'Desk', 'Seating area', 'Slippers', 'Telephone', 
  'Ironing facilities', 'Satellite channels', 'Tea/coffee maker', 'Iron', 
  'Hairdryer', 'Fan', 'Wake-up service/alarm clock', 'Carpeted floor', 
  'Electric kettle', 'Outdoor furniture', 'Wake-up service', 'Tumble dryer', 
  'Wardrobe/closet', 'Clothes rack', 'Toilet paper', 'Hand sanitizer'
];

const ListProperty = () => {
  const MAX_PHOTOS = 20;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<PropertyFormData>({
    property_type: '',
    name: '',
    description: '',
    street_address: '',
    city: '',
    state: '',
    amenities: {},
    rooms: [],
    checkin_time: '',
    checkout_time: '',
    cancellation_policy: '',
    photos: []
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const totalSteps = 7;
  const progress = (currentStep / totalSteps) * 100;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addRoom = () => {
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, {
        room_type: '',
        bed_type: '',
        max_guests: 1,
        units_available: 1,
        facilities: [],
        price_lkr: 0
      }]
    }));
  };

  const updateRoom = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map((room, i) => 
        i === index ? { ...room, [field]: value } : room
      )
    }));
  };

  const removeRoom = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Create property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          user_id: user.id,
          property_type: formData.property_type,
          name: formData.name,
          description: formData.description,
          street_address: formData.street_address,
          city: formData.city,
          state: formData.state,
          amenities: formData.amenities,
          checkin_time: formData.checkin_time,
          checkout_time: formData.checkout_time,
          cancellation_policy: formData.cancellation_policy,
          status: 'published'
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Create rooms
      if (formData.rooms.length > 0) {
        const roomsData = formData.rooms.map(room => ({
          property_id: property.id,
          room_type: room.room_type,
          bed_type: room.bed_type,
          max_guests: room.max_guests,
          units_available: room.units_available,
          facilities: room.facilities,
          price_lkr: room.price_lkr
        }));

        const { error: roomsError } = await supabase
          .from('property_rooms')
          .insert(roomsData);

        if (roomsError) throw roomsError;
      }

      // Create photos
      if (formData.photos.length > 0) {
        const photosData = formData.photos.map((url, index) => ({
          property_id: property.id,
          photo_url: url,
          sort_order: index,
        }));

        const { error: photosError } = await supabase
          .from('property_photos')
          .insert(photosData);

        if (photosError) throw photosError;
      }

      toast({
        title: "Property Listed Successfully!",
        description: "Your property has been listed and is now live.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error submitting property:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to list property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Choose Property Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-6 border rounded-lg cursor-pointer transition-all ${
                    formData.property_type === 'Hotel' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, property_type: 'Hotel' }))}
                >
                  <Building className="h-8 w-8 mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Hotel</h3>
                  <p className="text-sm text-muted-foreground">Commercial hospitality establishment with multiple rooms</p>
                </div>
                <div 
                  className={`p-6 border rounded-lg cursor-pointer transition-all ${
                    formData.property_type === 'Villa' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, property_type: 'Villa' }))}
                >
                  <Home className="h-8 w-8 mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Villa</h3>
                  <p className="text-sm text-muted-foreground">Private residence for vacation or short-term rental</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter property name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your property"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.street_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, street_address: e.target.value }))}
                  placeholder="Enter street address"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Enter state/province"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(AMENITY_CATEGORIES).map(([category, amenities]) => (
                <div key={category} className="space-y-3">
                  <h3 className="font-semibold text-lg">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={formData.amenities[category]?.includes(amenity) || false}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              amenities: {
                                ...prev.amenities,
                                [category]: checked
                                  ? [...(prev.amenities[category] || []), amenity]
                                  : (prev.amenities[category] || []).filter(a => a !== amenity)
                              }
                            }));
                          }}
                        />
                        <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Rooms & Units</CardTitle>
              <Button onClick={addRoom} variant="outline">
                Add Room Type
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.rooms.map((room, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Room {index + 1}</h3>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeRoom(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Room Type</Label>
                      <Input
                        value={room.room_type}
                        onChange={(e) => updateRoom(index, 'room_type', e.target.value)}
                        placeholder="e.g., Standard Double Room"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bed Type</Label>
                      <Select
                        value={room.bed_type}
                        onValueChange={(value) => updateRoom(index, 'bed_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bed type" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Single', 'Double', 'Twin', 'Queen', 'King'].map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Guests</Label>
                      <Select
                        value={room.max_guests.toString()}
                        onValueChange={(value) => updateRoom(index, 'max_guests', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 9}, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Units Available</Label>
                      <Select
                        value={room.units_available.toString()}
                        onValueChange={(value) => updateRoom(index, 'units_available', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 9}, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Price per Unit (LKR)</Label>
                    <Input
                      type="number"
                      value={room.price_lkr}
                      onChange={(e) => updateRoom(index, 'price_lkr', parseFloat(e.target.value) || 0)}
                      placeholder="Enter price in LKR"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Room Facilities</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {ROOM_FACILITIES.map((facility) => (
                        <div key={facility} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${index}-${facility}`}
                            checked={room.facilities.includes(facility)}
                            onCheckedChange={(checked) => {
                              const facilities = checked
                                ? [...room.facilities, facility]
                                : room.facilities.filter(f => f !== facility);
                              updateRoom(index, 'facilities', facilities);
                            }}
                          />
                          <Label htmlFor={`${index}-${facility}`} className="text-sm">
                            {facility}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkin">Check-in Time</Label>
                  <Input
                    id="checkin"
                    type="time"
                    value={formData.checkin_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkin_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkout">Check-out Time</Label>
                  <Input
                    id="checkout"
                    type="time"
                    value={formData.checkout_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkout_time: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cancellation Policy</Label>
                <Select
                  value={formData.cancellation_policy}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cancellation_policy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cancellation policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free Cancellation</SelectItem>
                    <SelectItem value="Non-refundable">Non-refundable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Upload Photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const allFiles = Array.from(e.target.files || []);
                    if (allFiles.length === 0) return;

                    const remaining = MAX_PHOTOS - formData.photos.length;
                    if (remaining <= 0) {
                      toast({ title: "Limit reached", description: `You can upload up to ${MAX_PHOTOS} photos.`, variant: "destructive" });
                      e.currentTarget.value = "";
                      return;
                    }

                    const files = allFiles.slice(0, remaining);
                    if (allFiles.length > remaining) {
                      toast({ title: "Too many files", description: `Only ${remaining} more photo(s) can be uploaded (max ${MAX_PHOTOS}).` });
                    }
                    setIsUploading(true);
                    try {
                      const uploads = await Promise.all(
                        files.map(async (file) => {
                          const result = await uploadImageToCloudinary(file);
                          return result.url;
                        })
                      );
                      setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...uploads] }));
                      toast({ title: "Uploaded", description: `${uploads.length} photo(s) uploaded.` });
                    } catch (err: any) {
                      console.error("Upload error", err);
                      toast({ title: "Upload failed", description: err.message || "Unable to upload", variant: "destructive" });
                    } finally {
                      setIsUploading(false);
                      // reset the input so same files can be selected again
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Label
                  htmlFor="photos"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md ${formData.photos.length >= MAX_PHOTOS || isUploading ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90'}`}
                >
                  {isUploading ? 'Uploading...' : (formData.photos.length >= MAX_PHOTOS ? 'Max photos reached' : 'Select Photos')}
                </Label>
                <p className="text-xs text-muted-foreground mt-2">{formData.photos.length}/{MAX_PHOTOS} uploaded. You can select multiple images.</p>
              </div>

              {formData.photos.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Preview</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.photos.map((url, idx) => (
                      <div key={url + idx} className="relative group">
                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-32 object-cover rounded-md border" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-background/80 backdrop-blur border rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, photos: prev.photos.filter((p, i) => i !== idx) }))
                          }
                          aria-label="Remove photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Review & Submit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Property Type</h3>
                  <p className="text-muted-foreground">{formData.property_type}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Property Name</h3>
                  <p className="text-muted-foreground">{formData.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-muted-foreground">
                    {formData.street_address}, {formData.city}, {formData.state}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Rooms</h3>
                  <p className="text-muted-foreground">{formData.rooms.length} room types configured</p>
                </div>
                <div>
                  <h3 className="font-semibold">Policies</h3>
                  <p className="text-muted-foreground">
                    Check-in: {formData.checkin_time || 'Not set'} | 
                    Check-out: {formData.checkout_time || 'Not set'} | 
                    Cancellation: {formData.cancellation_policy || 'Not set'}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Photos</h3>
                  <p className="text-muted-foreground">{formData.photos.length} photo(s) uploaded</p>
                </div>
              </div>
              <Button 
                onClick={handleSubmit} 
                className="w-full" 
                variant="hero"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Publishing Property...' : 'Publish Property'}
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {renderStep()}
          
          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            {currentStep < totalSteps && (
              <Button
                onClick={nextStep}
                variant="hero"
                disabled={
                  (currentStep === 1 && !formData.property_type) ||
                  (currentStep === 2 && (!formData.name || !formData.street_address || !formData.city || !formData.state))
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ListProperty;