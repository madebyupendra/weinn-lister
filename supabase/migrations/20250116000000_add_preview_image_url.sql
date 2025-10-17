-- Add preview_image_url column to properties table
ALTER TABLE public.properties 
ADD COLUMN preview_image_url TEXT;
