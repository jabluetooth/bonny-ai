## Step 1: Create the 'type' column
Run this command first to add the missing column:
```sql
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS type text;
```

## Step 2: Insert Data
After Step 1 is successful, run this to insert the projects:
```sql
INSERT INTO public.projects (title, description, tech_stack, github_url, live_url, demo_url, image_url, key_features, challenges_learned, type)
VALUES 
  (
    'E-Commerce Dashboard',
    'A comprehensive dashboard for managing online stores, sales, and inventory.',
    ARRAY['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Recharts'],
    'https://github.com/',
    'https://demo.com',
    'https://demo.com',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop',
    ARRAY['Real-time sales analytics', 'Inventory management', 'User role management', 'Order tracking system'],
    'Implementing real-time updates for the inventory system was challenging.',
    'Web Development'
  ),
  (
    'SaaS Landing Page',
    'A high-conversion landing page for a SaaS product with pricing and auth.',
    ARRAY['React', 'Vite', 'Stripe', 'Framer Motion'],
    'https://github.com/',
    'https://demo.com',
    'https://demo.com',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop',
    ARRAY['Responsive Design', 'Stripe Checkout', 'Animated sequences', 'SEO Optimized'],
    'Optimizing images and animations for a perfect Lighthouse score.',
    'Web Development'
  ),
  (
    'Task Management App',
    'A collaborative task management tool for teams.',
    ARRAY['Vue.js', 'Firebase', 'Pinia', 'Drag and Drop API'],
    'https://github.com/',
    'https://demo.com',
    'https://demo.com',
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=1000&auto=format&fit=crop',
    ARRAY['Drag and drop interface', 'Collaborative workspaces', 'Due date notifications', 'Dark mode support'],
    'Designing a smooth drag-and-drop experience across different devices.',
    'Web Development'
  ),
  (
    'AI Chat Assistant',
    'An intelligent chat interface powered by large language models.',
    ARRAY['React', 'OpenAI API', 'Vercel AI SDK', 'Radix UI'],
    'https://github.com/',
    'https://demo.com',
    'https://demo.com',
    'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=1000&auto=format&fit=crop',
    ARRAY['Context-aware conversations', 'Streaming responses', 'Markdown support', 'Code syntax highlighting'],
    'Handling streaming responses.',
    'AI & ML'
  ),
  (
    'Image Recognition Model',
    'A computer vision model capable of identifying objects in real-time video feeds.',
    ARRAY['Python', 'TensorFlow', 'OpenCV', 'FastAPI'],
    'https://github.com/',
    'https://demo.com',
    'https://demo.com',
    'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=1000&auto=format&fit=crop',
    ARRAY['Real-time object detection', 'High accuracy', 'Low latency inference', 'Video stream processing'],
    'Optimizing the model for real-time performance on edge devices.',
    'AI & ML'
  ),
  (
    'Sentiment Analysis Tool',
    'An NLP tool that analyzes customer feedback to determine sentiment trends.',
    ARRAY['Python', 'NLP', 'Hugging Face', 'Streamlit'],
    'https://github.com/',
    'https://demo.com',
    'https://demo.com',
    'https://images.unsplash.com/photo-1518186285589-1f76d31d6928?q=80&w=1000&auto=format&fit=crop',
    ARRAY['Multi-language support', 'Trend visualization', 'Exportable reports', 'Custom model fine-tuning'],
    'Fine-tuning a BERT model on a specific industry dataset.',
    'AI & ML'
  );
```
