This is a backup of the original Firebase-based development plan.

# Comprehensive Development Plan for TikTok Template Tracker MVP (Enhanced Version)

Below is a step-by-step development plan with specific prompts for the Cursor.com Claude 3.7 agent, updated to include newsletter integration, super admin functionality, and expert-augmented AI capabilities. Each step builds on the previous one, with testing checkpoints to ensure successful completion before moving forward.

## Week 1: Enhance Existing Application & Add Trend Analysis

### Step 1: Setup Apify TikTok Scraper & Enhanced Database Schema (Days 1-2)

@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
In addition to the template data scraping, I need to enhance the Apify TikTok scraper to specifically collect sound and music data. Please help me:

When implementing audio data collection and storage:
- Design the database schema with a unified audio experience in mind, not as a separate system
- Create bidirectional relationships between templates and sounds in the data model
- Implement progressive data loading patterns for audio metadata to optimize performance
- Establish a consistent taxonomy for sound categorization that will be used throughout the application
- Set up audio data validation rules to ensure quality and consistency

The audio ETL process should follow user-centered workflow patterns by prioritizing the sounds most relevant to trending templates first, establishing clear audio provenance tracking, and implementing efficient delta updates for incremental audio data processing.

1. Expand the Apify scraper configuration to capture audio metadata including:
   - Sound/track name and ID
   - Creator/artist information
   - Sound duration
   - Original vs. remix status
   - Usage count across videos

2. Extend the Firebase Firestore database schema to include:
   - Sounds collection with comprehensive metadata
   - Sound growth metrics (7-day, 14-day, 30-day growth)
   - Sound-to-template mapping relationships
   - Sound category/genre classification
   - Sound engagement correlation metrics
   - Expert annotation fields for sound metadata

3. Enhance the ETL process to:
   - Process and clean sound metadata
   - Track historical usage patterns
   - Calculate growth velocity for sounds
   - Generate daily sound trend reports
   - Create sound-template correlation analysis

Please provide complete implementation for these enhancements with database schema updates, scraper configurations, and sound-specific ETL processes.
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

```
I need to set up an Apify TikTok scraper to collect trending videos and create an enhanced database schema to store video metadata for my TikTok Template Tracker application.

My current tech stack:
- Next.js 14 with App Router
- Firebase Firestore for database
- React with TypeScript
- Tailwind CSS

Please help me:
1. Set up the Apify TikTok scraper integration
2. Create a database schema in Firebase Firestore for storing template data, including fields for manual expert input (e.g., expert insight tags, manual adjustment logs)
3. Design a robust ETL process with data cleaning, error handling, and detailed logging to move data from Apify to our database
4. Add a scheduled job to run this process daily with monitoring and alerting mechanisms

Here's my existing firebase.ts configuration:
[Include your Firebase configuration file here]

I want the database schema to store:
- Template metadata (title, category, duration, views)
- Engagement metrics (likes, comments, shares)
- Template structure (sections, transitions, text overlay positions)
- Growth data for trend analysis
- Expert insight tags and manual adjustment logs
- Audit trails for expert modifications

Please provide complete code examples and configuration steps.
```

**Testing Checkpoint:**
- Verify Apify scraper can successfully collect TikTok data
- Confirm extended Firestore fields are properly populated
- Test the enhanced ETL process for error handling and logging
- Ensure the scheduled job triggers alerts on failure

### Step 2: Hybrid Template Analyzer Implementation (Days 3-4)

@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Following our template analyzer implementation, I need to build a dedicated Sound Trend Analysis service that works alongside it. Please help me create:

The Sound Trend Analysis service must share core analysis infrastructure with the Template Analyzer rather than functioning as a completely separate system. Implement a shared analytics foundation with:
- Common data processing pipelines for both template and sound analysis
- Unified scoring mechanisms that work consistently across content types
- Shared prediction models that analyze template-sound combinations holistically
- Consistent taxonomy and classification systems
- Joint audit trails for both template and sound performance metrics

This unified approach ensures users experience template and sound features as an integrated system rather than separate tools. All algorithm components should include error resilience with graceful degradation for audio processing failures.

1. A service that processes TikTok sound data to:
   - Identify and categorize trending sounds/music
   - Calculate sound growth metrics (velocity, acceleration, reach)
   - Determine correlation between sounds and engagement
   - Track sound lifecycle stages (emerging, peaking, declining)
   - Map sounds to successful template types

2. An audio categorization system that:
   - Classifies sounds by type (music, voice, effect, etc.)
   - Organizes by genre, tempo, mood, and other audio characteristics
   - Tags sounds by content category and audience appeal

3. A sound-template pairing algorithm that:
   - Identifies which sounds work best with specific templates
   - Suggests optimal sound-template combinations
   - Predicts engagement based on sound-template pairing

4. A sound growth prediction model that:
   - Identifies early-stage viral sounds
   - Estimates growth trajectory and peak timing
   - Calculates probability of significant adoption

The service should store all analysis in Firebase and provide API endpoints for frontend access. It should also include hooks for expert analysis input and maintain an audit trail of all prediction accuracy.

Please provide complete implementation with API calls, processing logic, and database operations for the Sound Trend Analysis service.
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

```
Now that we have the Apify scraper working and data flowing into Firebase, I need to implement a hybrid template analyzer service that processes the video data and incorporates expert insights.

Please help me create:
1. A service that analyzes video metadata to identify template patterns
2. A categorization system that groups similar templates
3. A way to extract template structure (intro, body, call-to-action, etc.)
4. A system to track template popularity metrics
5. Hooks to capture and store curated human insights alongside automated analysis

Specifically, I want to:
- Use Claude.ai API for text analysis of video captions and comments
- Implement logic to identify common template structures
- Track engagement velocity (how quickly a template is gaining popularity)
- Store analysis results back in Firebase
- Modify the database schema to accept and store expert-supplied strategies for enhancing template predictions

Here's my current data structure:
[Include your Firebase schema from the previous step]

Please provide complete implementation with API calls, processing logic, and database operations for both automated analysis and expert input integration.
```

**Testing Checkpoint:**
- Verify analyzer can process scraped videos
- Confirm templates are properly categorized
- Test that template structure extraction works correctly
- Validate that the analyzer processes data and captures expert inputs
- Ensure the updated schema properly stores manual strategies 