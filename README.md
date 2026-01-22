<p align="center">
<img src="src/assets/main.png" width="100%"/>
</p>

# Your Rapport – Collect, Reflect, and Collaborate.

Your Rapport is an open source digital archiving platform that runs within your browser. It uses plugins written in json
to provide additional functionality. The functionality aids in adding flexibility without introducing lots of custom code
or complexity.

Below are the stages used to process captured information, commonly referred to as an ETL pipeline. This workflow is 
designed to run entirely inside a Chrome extension. Discovery Plugins connect events to actions. For example, you might 
save a web page, an MHTML file, an image, or a snippet of JavaScript and then trigger a scan by a remote service to 
extract people, places, or names from the text, or run OCR to pull text from an image. The extension collects the 
content through your browser and stores it locally. When you choose to send data to a remote service, you can also store
the response locally so it becomes part of your archive. Below is a breakdown of each stage involved in processing 
online content within the Chrome extension.

* Collecting
  * Media Types
    * Text Types
    * Image Types
    * Audio Types (Not Supported, yet)
    * Video Types (Not Supported, yet)
  * Formats
    * MHTML
    * HTML
    * JSON
    * Base64
  * Automations
    * Bulk Url Input
    * Scheduled Automations
* Persistence
  * Indexeddb (In app database)
  * Importing
    * Uploading Dialog
    * Auto Sync (Not Available, yet)
  * Exporting
    * Sync to Local Disk (Pro Feature)
    * Sync to Remote Source
    * Export to File
  * Change Data Capture
    * Change Detection
    * Audit Logging (Not Available, yet)
* Indexing
  * Search
    * Free Text
    * Tags
    * Selectors
    * Domains
    * Boolean Operators (Not Available, yet)
    * SQL (Not Available, yet)
  * Schemas
    * Rapport 
    * DiscoveryPlugin
    * Artifact
* Analysis
  * Merging Screenshots
  * Web Application Integrations
  * Chrome Extension Integrations
  * Data Viewer
  * Data Integrity Hash
* Workflow
  * Discovery Plugins
    * Events
      * Create
      * Update
      * Delete
    * Actions
      * Create Tab
      * Submit Form
      * Foreground Runner
      * Background Runner
  * Case Management (Not Available, yet)
    * Create
    * Update
    * Delete
  * Reporting
    * Basic Reports
    * Dashboard Reports (Not Available, yet)
  * Simplified Export (For AI Tools)

Your Rapport is an Open Source tool that implements the best practices for 
protecting your privacy and archiving online content. You can easily import, export, or print screenshots from 
your collection. Your Rapport is free to use, but has a couple pro features you will need to pay for, such as local sync
or advanced change detection algorithms when collecting data. This enables us to continue development and support for this product. 

Consider supporting this project for $3 a month, available through stripe [pro license](https://buy.stripe.com/4gM5kDbRcgWW8d7gLedAk00).

[Change Log](https://github.com/yooper/your-rapport/wiki/Change-Log)

[Wiki Docs](https://github.com/yooper/your-rapport/wiki)

Check out the wiki for more in depth information. Or review the source code in the github repo. 

### Getting Started 
After installing the Chrome extension from https://chromewebstore.google.com/detail/your-rapport/clkaalonjdkliiaadkgodlfbiipidjmn, 
"Your Rapport" will automatically be ready to collect.

After installing, click the "Your Rapport" pin in your extension tab and select the action you want performed or,  

There are several options and actions available when archiving data:
 * `Alt+S` collects a single screenshot and deep copy which is a mhtml file and a html version of the web page.
 * `Alt+A` autoscroll and collect multiple screenshots, or stop the autoscroll.
 * `Alt+X` opens up the dashboard where you can search, print, share, or delete your collection. 
 * `Alt+Q` quick scan opens a sub-panel that displays data extracted insights from the live web page. 
 * `Mouse - Right Click` gives several options depending upon what you click on within a web page

Your Rapport is an open source commercial tool for the following reasons:
 * Transparency in how software works and where the data goes is an important security and privacy concern to all of us
 * A commercial tool is the only viable way to support developing a standard set of open source tools, useful for doing online research or archiving
 * Keeps the infrastructure costs lower by not having additional overhead with privatized Software as a Service approach
 * Implement best practices based on community feedback
 * Provide the data in multiple formats and make it easy to transfer to different locations
 * The target price for the Pro license can be set to $3 a month support us [here](https://buy.stripe.com/4gM5kDbRcgWW8d7gLedAk00) 

# Key Features
* Mostly Free
* Archive thousands of web pages, images, articles, recipes, or other content from the web. 
* Search using text, tags, selectors or dates to filter and dive into your digital archives.
* Source code is Open Source

