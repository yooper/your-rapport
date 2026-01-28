<p align="center">
<img src="src/assets/main.png" width="100%"/>
</p>

# Your Rapport – Collect, Reflect, and Collaborate.

Your Rapport is an open source digital archiving platform that runs entirely within your browser. It uses plugins written 
in json to provide additional functionality. The functionality aids in adding flexibility without introducing lots of 
custom code or complexity. This product is meant to simplify digital archiving by providing tools that can automate most
of the collection process. 

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


Consider supporting this project for $3 a month, available through stripe [pro license](https://buy.stripe.com/4gM5kDbRcgWW8d7gLedAk00).

[Change Log](https://github.com/yooper/your-rapport/wiki/Change-Log)

[Wiki Docs](https://github.com/yooper/your-rapport/wiki)

Check out the wiki for more in depth information. Or review the source code in the github repo. 

# Key Features
* Mostly Free
* Archive thousands of web pages, images, articles, recipes, or other content from the web. 
* Search using text, tags, selectors or dates to filter and dive into your digital archives.
* Source code is Open Source


# Technical and Product Roadmap 

Below are the stages used to process collected information, commonly referred to as an ETL pipeline. This workflow is 
designed to run entirely inside a Chrome extension. Discovery Plugins connect events to actions. For example, you might 
save a web page, an MHTML file, an image, or a snippet of JavaScript and then trigger a scan by a remote service to 
extract people, places, or names from the text, or run OCR to pull text from an image. The extension collects the 
content through your browser and stores it locally. When you choose to send data to a remote service, you can also store
the response locally so it becomes part of your archive. Below is a breakdown of each stage involved in processing 
online content within the Chrome extension.

* [Collecting](Collecting-Web-Content)
  * Digital Media Content
    * [Deep Save](Deep-Save)
    * [Auto Collect](Auto-Collect)
    * [Audio Collect](Audio-Collect) (Not Supported, yet)
    * [Video Collect](Video-Collect) (Not Supported, yet)
  * [Media Types](supported-collection-types)
    * [Text Types](Text-Types)
    * [Image Types](Image-Types)
    * [Audio Types](Audio-Types) (Not Supported, yet)
    * [Video Types](Video-Types) (Not Supported, yet)
  * [Formats](Formats)
    * [MHTML](MHTML)
    * [HTML](HTML)
    * [JSON](JSON)
    * [Base64](Base64)
  * [Automations](Setting-Up-And-Running-Automations)
    * [Bulk Url Input](Your-Rapport-Bulk-Collection)
    * [Scheduled Automations](Scheduled-Automations)
* [Persistence](Persistence)
  * [Indexeddb](IndexedDB) (In app database)
  * [Importing](import-a-collection)
    * [Uploading Dialog](Uploading-Dialog)
    * [Auto Sync](Auto-Sync) (Not Available, yet)
  * [Exporting](exporting-and-sharing-your-collection)
    * [Sync to Local Disk](Sync-to-Local-Vault) (Pro Feature)
    * [Sync to Remote Source](Sync-to-Remote-Source) (Available through Discovery Plugins)
    * [Export to File](Export-to-File)
  * [Change Data Capture](Change-Data-Capture)
    * [Change Detection](Change-Detection)
    * [Audit Logging](Audit-Logging) (Not Available, yet)
* [Indexing](Indexing)
  * [Search](Working-With-Your-Rapport-Collections-in-the-Search-Dashboard)
    * [Free Text](Free-Text-Search)
    * [Tags](Your-Rapport-Tag-Management)
    * [Selectors](Your-Rapport-Selectors)
    * [Domains](Domains)
    * [Boolean Operators](Boolean-Operators) (Not Available, yet)
  * [Schemas](Schemas)
    * [Rapport](Rapport-Schema)
    * [DiscoveryPlugin](DiscoveryPlugin-Schema)
    * [Artifact](Artifact-Schema)
* [Analysis](Analysis)
  * [Merging Screenshots](Merging-Screenshots)
  * [Quick Scan](Quick-Scan) 
  * [SQL](SQL) (Not Available, yet)
  * [Web Application Integrations](Web-Application-Integrations)
  * [Chrome Extension Integrations](Chrome-Extension-Integrations)
  * [Data Viewer](Data-Viewer)
  * [Data Integrity Hash](Data-Integrity-Hash)
* [Workflow](Workflow)
  * [Api Keys](Api-Key-Management)
  * [Discovery Plugins](discovery-plugins-tutorial)
    * [Events](Discovery-Plugin-Events)
      * [Create](Discovery-Plugin-Create)
      * [Update](Discovery-Plugin-Update)
      * [Delete](Discovery-Plugin-Delete)
    * [Actions](Discovery-Plugin-Actions)
      * [Create Tab](Create-Tab)
      * [Submit Form](Submit-Form)
      * [Foreground Runner](Foreground-Runner)
      * [Background Runner](Background-Runner)
  * [Case Management](Case-Management) (Not Available, yet)
    * [Create](Case-Create)
    * [Update](Case-Update)
    * [Delete](Case-Delete)
  * [Reporting](Reporting)
    * [Basic Reports](Basic-Reports)
    * [Dashboard Reports](Dashboard-Reports) (Not Available, yet)
  * [Simplified Export](Simplified-Export-For-AI-Tools) (For AI Tools)


Your Rapport is an Open Source tool that implements the best practices for 
protecting your privacy and archiving online content. You can easily import, export, or print screenshots from 
your collection. Your Rapport is free to use, but has a couple pro features you will need to pay for, such as local sync
or advanced change detection algorithms when collecting data. This enables us to continue development and support for this product. 

Your Rapport is an open source commercial tool for the following reasons:
 * Transparency in how software works and where the data goes is an important security and privacy concern to all of us
 * A commercial tool is the only viable way to support developing a standard set of open source tools, useful for doing online research or archiving
 * Keeps the infrastructure costs lower by not having additional overhead with privatized Software as a Service approach
 * Implement best practices based on community feedback
 * Provide the data in multiple formats and make it easy to transfer to different locations
 * The target price for the Pro license can be set to $3 a month support us [here](https://buy.stripe.com/4gM5kDbRcgWW8d7gLedAk00) 

