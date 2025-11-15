# Quick Start Guide - AI Hint Tutor Platform

This guide will help you get the AI Hint Tutor Platform up and running in under 10 minutes.

## Step 1: Clone and Install (2 minutes)

```bash
# Navigate to the project directory
cd ClaudeForGood

# Install dependencies
npm install
```

## Step 2: Set Up Supabase (3 minutes)

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details (choose a region close to you)
   - Wait for project to be ready (~2 minutes)

2. **Run Database Schema**
   - In your Supabase project, go to "SQL Editor"
   - Copy the entire contents of `supabase-schema.sql`
   - Paste and click "Run"
   - You should see "Success. No rows returned"

3. **Create Storage Bucket**
   - Go to "Storage" in the left sidebar
   - Click "New Bucket"
   - Name: `assignments`
   - Make it public: Yes
   - Click "Create Bucket"

4. **Get Your API Keys**
   - Go to "Settings" > "API"
   - Copy your:
     - Project URL
     - Anon/Public key

## Step 3: Get Anthropic API Key (2 minutes)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to "API Keys"
4. Click "Create Key"
5. Copy your API key

## Step 4: Configure Environment (1 minute)

```bash
# Copy the example env file
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Start the App (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## Step 6: Test the Platform (2 minutes)

### Create Teacher Account
1. Go to http://localhost:3000/auth/signup
2. Fill in:
   - Name: "Test Teacher"
   - Email: "teacher@test.com"
   - Password: "password123"
   - Role: **Teacher**
3. Click "Sign up"

### Create a Classroom
1. You'll be redirected to the teacher dashboard
2. Click "Create New Classroom"
3. Name: "Test Classroom"
4. Description: "My first classroom"
5. Click "Create Classroom"

### Create an Assignment
1. Go to "Assignments" in the nav
2. Click "Create Assignment"
3. Fill in:
   - Classroom: Select "Test Classroom"
   - Title: "Math Problem Set 1"
   - Description: "Practice problems on algebra"
   - Hint Level: 3 (Moderate)
   - Max Prompts: 5
   - Answer Key: "The answer to problem 1 is x = 5"
4. Click "Create Assignment"

### Test as a Student
1. Open a new incognito/private window
2. Go to http://localhost:3000/auth/signup
3. Create a student account:
   - Name: "Test Student"
   - Email: "student@test.com"
   - Password: "password123"
   - Role: **Student**

### Manually Enroll Student (Temporary - for MVP)
1. Go to your Supabase dashboard
2. Click "Table Editor" > "classroom_enrollments"
3. Click "Insert" > "Insert row"
4. Fill in:
   - classroom_id: Copy from classrooms table
   - student_id: Copy from users table (student's ID)
   - status: active
5. Click "Save"

### Ask a Question as Student
1. In the student window, refresh the page
2. You should see the assignment
3. Click on it
4. Type a question: "I'm stuck on problem 1. What should I do first?"
5. Click "Get Hint"
6. See the AI-generated hint!

## Common Issues

### "Module not found" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules .next
npm install
```

### Supabase connection fails
- Double-check your `.env.local` file
- Make sure you're using the correct project URL (should end in .supabase.co)
- Verify the anon key is correct

### Claude API fails
- Verify your API key is correct
- Make sure you have credits in your Anthropic account
- Check the console for specific error messages

### Can't see classrooms as student
- Remember to manually add enrollment in Supabase dashboard
- Make sure the status is 'active'
- Use the correct student_id and classroom_id

## Next Steps

- Explore the teacher dashboard
- Create more classrooms and assignments
- Test different hint levels (1-5)
- Try reaching the prompt limit
- View the question history

## Need Help?

- Check the main README.md for detailed documentation
- Review the database schema in supabase-schema.sql
- Check the troubleshooting section in README.md

## Production Deployment

When you're ready to deploy:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add all environment variables from `.env.local`
5. Deploy!

That's it! You now have a fully working AI Hint Tutor Platform.
