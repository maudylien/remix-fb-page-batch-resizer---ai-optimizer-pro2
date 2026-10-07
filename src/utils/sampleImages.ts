export interface SampleImageInfo {
  title: string;
  category: string;
  url: string;
}

export const SAMPLE_IMAGES: SampleImageInfo[] = [
  {
    title: 'Cinematic Portrait (Portrait Focus)',
    category: 'Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Artisanal Coffee & Latte (Product Focus)',
    category: 'Culinary',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Tropical Island Sunset (Scenic Landscape)',
    category: 'Travel',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Futuristic Sports Car (Subject Center)',
    category: 'Automotive',
    url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  },
];

export async function fetchSampleAsFile(sample: SampleImageInfo): Promise<File> {
  const resp = await fetch(sample.url, { mode: 'cors' });
  const blob = await resp.blob();
  const ext = blob.type === 'image/jpeg' ? '.jpg' : '.png';
  const fileName = sample.title.toLowerCase().replace(/[^a-z0-9]+/g, '_') + ext;
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
}
