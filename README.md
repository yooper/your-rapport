<p align="center">
<img src="src/assets/main.png" width="100%"/>
</p>

# Your Rapport – Collect, Reflect, and Collaborate.

Your Rapport is an open source digital archiving platform that runs entirely within your browser. It uses plugins written 
in json to provide additional functionality. The functionality aids in adding flexibility without introducing lots of 
custom code or complexity. This product is meant to simplify digital archiving by providing tools that can automate most
of the collection process. 

# Privacy Policy
We do not collect your data, share your data , store your data or even handle your data. All your data stays on your computer. Please see our privacy policy and feel free to reach 
out with any suggestions on improvements. https://bakerstreet.llc/your-rapport-privacy-policy/

**This is an open source project, which strives to prioritize your privacy.**

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

Below are the stages used to process collected information, that stays locally on your machine, commonly referred to as an ETL pipeline. This workflow is 
designed to run entirely inside a Chrome extension. Discovery Plugins connect events to actions. For example, you might 
save a web page, an MHTML file, an image, or a snippet of JavaScript and then trigger a scan by a remote service to 
extract people, places, or names from the text, or run OCR to pull text from an image. The extension collects the 
content through your browser and stores it locally. When you choose to send data to a remote service, you can also store
the response locally so it becomes part of your archive. Below is a breakdown of each stage involved in processing 
online content within the Chrome extension.

* [Collecting](https://github.com/yooper/your-rapport/wiki/Auto-CollectCollecting-Web-Content)
  * Digital Media Content
    * [Deep Save](https://github.com/yooper/your-rapport/wiki/Deep-Save)
    * [Auto Collect](https://github.com/yooper/your-rapport/wiki/Auto-Collect)
    * [Audio Collect](https://github.com/yooper/your-rapport/wiki/Audio-Collect) (Not Supported, yet)
    * [Video Collect](https://github.com/yooper/your-rapport/wiki/Video-Collect) (Not Supported, yet)
  * [Media Types](https://github.com/yooper/your-rapport/wiki/supported-collection-types)
    * [Text Types](https://github.com/yooper/your-rapport/wiki/Text-Types)
    * [Image Types](https://github.com/yooper/your-rapport/wiki/Image-Types)
    * [Audio Types](https://github.com/yooper/your-rapport/wiki/Audio-Types) (Not Supported, yet)
    * [Video Types](https://github.com/yooper/your-rapport/wiki/Video-Types) (Not Supported, yet)
  * [Formats](https://github.com/yooper/your-rapport/wiki/Formats)
    * [MHTML](https://github.com/yooper/your-rapport/wiki/MHTML)
    * [HTML](https://github.com/yooper/your-rapport/wiki/HTML)
    * [JSON](https://github.com/yooper/your-rapport/wiki/JSON)
    * [Base64](https://github.com/yooper/your-rapport/wiki/Base64)
  * [Automations](https://github.com/yooper/your-rapport/wiki/Setting-Up-And-Running-Automations)
    * [Bulk Url Input](https://github.com/yooper/your-rapport/wiki/Your-Rapport-Bulk-Collection)
    * [Scheduled Automations](https://github.com/yooper/your-rapport/wiki/Scheduled-Automations)
* [Persistence](https://github.com/yooper/your-rapport/wiki/Persistence)
  * [Indexeddb](https://github.com/yooper/your-rapport/wiki/IndexedDB) (In app database)
  * [Importing](https://github.com/yooper/your-rapport/wiki/import-a-collection)
    * [Uploading Dialog](https://github.com/yooper/your-rapport/wiki/Uploading-Dialog)
    * [Auto Sync](https://github.com/yooper/your-rapport/wiki/Auto-Sync) (Not Available, yet)
  * [Exporting](https://github.com/yooper/your-rapport/wiki/exporting-and-sharing-your-collection)
    * [Sync to Local Disk](https://github.com/yooper/your-rapport/wiki/Sync-to-Local-Vault) (Pro Feature)
    * [Sync to Remote Source](https://github.com/yooper/your-rapport/wiki/Sync-to-Remote-Source) (Available through Discovery Plugins)
    * [Export to File](https://github.com/yooper/your-rapport/wiki/Export-to-File)
  * [Change Data Capture](https://github.com/yooper/your-rapport/wiki/Change-Data-Capture)
    * [Change Detection](https://github.com/yooper/your-rapport/wiki/Change-Detection)
    * [Audit Logging](https://github.com/yooper/your-rapport/wiki/Audit-Logging) (Not Available, yet)
* [Indexing](https://github.com/yooper/your-rapport/wiki/Indexing)
  * [Search](https://github.com/yooper/your-rapport/wiki/Working-With-Your-Rapport-Collections-in-the-Search-Dashboard)
    * [Free Text](https://github.com/yooper/your-rapport/wiki/Free-Text-Search)
    * [Tags](https://github.com/yooper/your-rapport/wiki/Your-Rapport-Tag-Management)
    * [Selectors](https://github.com/yooper/your-rapport/wiki/Your-Rapport-Selectors)
    * [Domains](https://github.com/yooper/your-rapport/wiki/Domains)
    * [Boolean Operators](https://github.com/yooper/your-rapport/wiki/Boolean-Operators) (Not Available, yet)
  * [Schemas](https://github.com/yooper/your-rapport/wiki/Schemas)
    * [Rapport](https://github.com/yooper/your-rapport/wiki/Rapport-Schema)
    * [DiscoveryPlugin](https://github.com/yooper/your-rapport/wiki/DiscoveryPlugin-Schema)
    * [Artifact](https://github.com/yooper/your-rapport/wiki/Artifact-Schema)
* [Analysis](https://github.com/yooper/your-rapport/wiki/Analysis)
  * [Merging Screenshots](https://github.com/yooper/your-rapport/wiki/Merging-Screenshots)
  * [Quick Scan](https://github.com/yooper/your-rapport/wiki/Quick-Scan) 
  * [SQL](https://github.com/yooper/your-rapport/wiki/SQL) (Not Available, yet)
  * [Web Application Integrations](https://github.com/yooper/your-rapport/wiki/Web-Application-Integrations)
  * [Chrome Extension Integrations](https://github.com/yooper/your-rapport/wiki/Chrome-Extension-Integrations)
  * [Data Viewer](https://github.com/yooper/your-rapport/wiki/Data-Viewer)
  * [Data Integrity Hash](https://github.com/yooper/your-rapport/wiki/Data-Integrity-Hash)
* [Workflow](https://github.com/yooper/your-rapport/wiki/Workflow)
  * [Api Keys](https://github.com/yooper/your-rapport/wiki/Api-Key-Management)
  * [Discovery Plugins](https://github.com/yooper/your-rapport/wiki/discovery-plugins-tutorial)
    * [Events](https://github.com/yooper/your-rapport/wiki/Discovery-Plugin-Events)
      * [Create](https://github.com/yooper/your-rapport/wiki/Discovery-Plugin-Create)
      * [Update](https://github.com/yooper/your-rapport/wiki/Discovery-Plugin-Update)
      * [Delete](https://github.com/yooper/your-rapport/wiki/Discovery-Plugin-Delete)
    * [Actions](https://github.com/yooper/your-rapport/wiki/Discovery-Plugin-Actions)
      * [Create Tab](https://github.com/yooper/your-rapport/wiki/Create-Tab)
      * [Submit Form](https://github.com/yooper/your-rapport/wiki/Submit-Form)
      * [Foreground Runner](https://github.com/yooper/your-rapport/wiki/Foreground-Runner)
      * [Background Runner](https://github.com/yooper/your-rapport/wiki/Background-Runner)
  * [Case Management](https://github.com/yooper/your-rapport/wiki/Case-Management) (Not Available, yet)
    * [Create](https://github.com/yooper/your-rapport/wiki/Case-Create)
    * [Update](https://github.com/yooper/your-rapport/wiki/Case-Update)
    * [Delete](https://github.com/yooper/your-rapport/wiki/Case-Delete)
  * [Reporting](https://github.com/yooper/your-rapport/wiki/Reporting)
    * [Basic Reports](https://github.com/yooper/your-rapport/wiki/Basic-Reports)
    * [Dashboard Reports](https://github.com/yooper/your-rapport/wiki/Dashboard-Reports) (Not Available, yet)
  * [Simplified Export](https://github.com/yooper/your-rapport/wiki/Simplified-Export-For-AI-Tools) (For AI Tools)


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

