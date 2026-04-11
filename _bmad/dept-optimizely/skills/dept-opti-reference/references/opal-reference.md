# Optimizely Opal AI - Comprehensive Reference Guide

**Last Updated:** March 31, 2026  
**Version:** 1.0

A complete reference for configuring, building, and managing Optimizely Opal implementations. This guide is organized by topic for LLM-friendly navigation.

---

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Getting Started](#getting-started)
3. [Credits System & Reporting](#credits-system--reporting)
4. [Opal Chat Interface](#opal-chat-interface)
5. [External System Integrations](#external-system-integrations)
6. [Instructions Framework](#instructions-framework)
7. [Tools Ecosystem](#tools-ecosystem)
8. [System Tools Reference](#system-tools-reference)
9. [Connector Tools](#connector-tools)
10. [Custom Tools Development](#custom-tools-development)
11. [Agent Architecture](#agent-architecture)
12. [Pre-built Agent Directory](#pre-built-agent-directory)
13. [Specialized Agents Development](#specialized-agents-development)
14. [Workflow Agents Development](#workflow-agents-development)
15. [RAG (Retrieval-Augmented Generation)](#rag-retrieval-augmented-generation)
16. [AI Evaluations & Quality](#ai-evaluations--quality)
17. [Glossary & Key Terms](#glossary--key-terms)

---

## Overview & Architecture

### What is Optimizely Opal?

3/31/26, 8:24 PM

Articles in this section

Optimizely Opal overview
Updated 14 days ago

Follow

Optimizely Opal is an agent orchestration platform that helps you work smarter across
Optimizely One. Whether you create content, manage experiments, or analyze data, you
can use Opal to automate tasks, surface insights, and guide decision-making. Opal has a
flexible system of AI agents that are intelligent software components that understand
your intent and help you reach your goal.
See Optimizely Opal Essentials in Optimizely Academy for more information.

AI background
AI refers to software that performs tasks typically requiring human reasoning, such as
learning from data, making decisions, or solving problems. These systems identify
patterns, generate content, and offer insights using large language models (LLMs) and
other algorithms trained on vast datasets.
Recent advances in computing power, data availability, and model design accelerate how
people use AI across industries. At Optimizely, AI is embedded into the platform to help
you move faster, automate repetitive work, and make more informed decisions.

AI agents
AI agents are software systems that act on your behalf. They can analyze information,
interact with the platform or other tools, and adapt their behavior based on feedback.
Unlike traditional tools that only respond to direct input, agents can manage goals and
take steps to accomplish them.
Optimizely classifies AI agents into the following three broad types:
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/36354416686477-Optimizely-Opal-overview

1/10

3/31/26, 8:24 PM

Simple assistants – Help with straightforward tasks such as generating content,
formatting it into a structure, or offering ideas based on a prompt.
Specialized agents – Focus on a domain or tool. These agents use expert-level
context to analyze data, predict outcomes, or recommend next steps.
Workflow and autonomous agents – Coordinate and perform multi-step processes,
often by integrating with other tools. These agents can handle tasks across systems

### AI Features and Capabilities

3/31/26, 8:25 PM

Articles in this section

Optimizely Opal and AI features
Updated 14 days ago

Follow

Optimizely Opal is an agent orchestration platform that helps you work smarter across
Optimizely One. Opal is directly connected to your workflows, fully aware of your brand,
and powered by hundreds of tools to assist with marketing and digital tasks. Usage of
Opal features incurs credit charges.
In addition to Opal, Optimizely continues to develop various AI and machine learning
(ML) features embedded across its product suite. These features do not incur Opal credit
charges. For information on the differences between Optimizely Opal and generative AI,
see the blog article, Opal vs Regular GenAI: A Deep Dive.
For users on Opti ID, Administrators can turn off all applicable Optimizely Opal and AI
features from Admin Center > Settings > Generative AI. Users who are not on Opti ID
are not eligible for Optimizely Opal and must refer to each product's included AI feature
for instructions on how to turn it off.
For a full list of Optimizely Opal and included AI and ML features for specific products,
see the following links.
Note
Usage and billing update
Effective May 7, 2025, access to Optimizely Opal features across Content
Marketing Platform, Web Experimentation, Feature Experimentation,
Personalization, Content Management System (SaaS), Collaboration, and
Optimizely Data Platform will transition to a credit-based usage and billing model.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/23727985454861-Optimizely-Opal-and-AI-features

1/9

3/31/26, 8:25 PM

Optimizely Opal

Usage of Opal features incurs credit charges.

Prerequisites
You must use Opti ID to access Opal.
You must have generative AI enabled in Optimizely.

Optimizely Opal app
Opal administrators can extend Opal's base capabilities and
Configure and add pre-built instructions.
Create custom instructions.
Add default agents.
Create custom agents using specialized agents.
Add system tools.
Create custom tools.
Add connector tools to Opal from third-parties through Optimizely Connect Platform

---

## Getting Started

### For Administrators

Administrators are responsible for enabling Opal, managing user access, configuring integrations, and overseeing system health.

3/31/26, 8:25 PM

Articles in this section

Get started with Optimizely Opal for
administrators
Updated 16 minutes ago

Follow

Optimizely Opal is an agent orchestration platform that helps you work smarter across
Optimizely One. Optimizely Opal is automatically available and works by default, but you
can configure it based on your organization's needs. You must add users to Opal before
they can use it.

Add users and set permissions
Add and manage users and their permissions for Opal in the Opti ID Admin Center. See
manage users for instructions.
You can give users the following roles:
Opal Administrator – Ability to manage and configure users, instructions, tools,
agents, and connected product instances in the Optimizely Opal app. Can also access
Opal Chat within the Opal app and any connected Optimizely products. See Get
started with Optimizely Opal for administrators.
Agent Builder – Ability to create instructions, build agents, and access the Agent
Directory. Can also access Opal Chat within the Opal app and any connected
Optimizely products. See Get started with Optimizely Opal for agent builders.
Opal User – Ability to use Optimizely Opal from individual Optimizely products, with
access to Opal Chat within the Opal app and any connected Optimizely products. See
Get started with Optimizely Opal for users.
If the available system roles do not provide the specific access you want to grant users,
you can create a custom role in the Opti ID Admin Center. See Custom roles for
Optimizely Opal for what roles are available.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/36359944449805-Get-started-with-Optimizely-Opal-for-administrators

1/14

3/31/26, 8:25 PM

Access the Optimizely Opal app

The Optimizely Opal app is Opal's configuration dashboard, accessible through the
product switcher in the global navigation.
1. Log in to Optimizely.
2. Select your organization.
3. Click Opal.

Customize Opal
You can customize Opal to tailor its behavior, responses, and integrations to match your
organization's goals. By configuring custom instructions, agents, and tools, you can
shape how Opal works with your team and systems, providing you a personalized
experience instead of a one-size-fits-all approach.
Customizations ensure that Opal understands your brand voice, can access the right
data, and performs actions that align with your workflows.

Ways to customize Opal
There are several ways to customize Opal, depending on the level of control you need:
Connections – Link Opal to your Optimizely product instances so it can take action

### For Agent Builders

Agent builders create custom agents, specialized workflows, and automation solutions within Opal.

3/31/26, 8:25 PM

Articles in this section

Get started with Optimizely Opal for agent
builders
Updated 17 minutes ago

Follow

Optimizely Opal is an agent orchestration platform that helps you work smarter across
Optimizely One. But, before you can access Opal, an Optimizely Administrator must add
you as a user and set your permissions. See Get started with Optimizely Opal for
administrators.
Note
The availability of features depends on your plan type. If your plan type does not
support the use of the Agent Builder role, assigning the Agent Builder role to a
user grants them only Opal User permissions. Contact your Customer Success
Manager if you have any questions.

Access the Optimizely Opal app
The Optimizely Opal app is Opal's configuration dashboard, accessible through the
product switcher in the global navigation.
1. Log in to Optimizely.
2. Select your organization.
3. Click Opal.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43183109095949-Get-started-with-Optimizely-Opal-for-agent-builders

1/7

3/31/26, 8:25 PM

Opal App UI
The Opal App provides a centralized interface where you can access Opal's capabilities in
one place. The Opal App UI support everything you need to configure, customize, and
use Opal effectively. Each page helps you focus on outcomes while Opal handles the
technical details behind the scenes.

Opal Chat

Chat is the conversational interface for Optimizely Opal. It lets you interact with Opal
using natural language to complete tasks, get insights, and automate workflows without
needing to know the underlying systems or commands.
https://support.optimizely.com/hc/en-us/articles/43183109095949-Get-started-with-Optimizely-Opal-for-agent-builders

2/7

3/31/26, 8:25 PM

You can ask Opal questions, make requests, or give instructions, and Opal determines the
right tools and agents to use to deliver accurate, actionable results. Whether you need to
generate content, analyze data, or manage experiments, Opal Chat provides a simple,
intuitive way to work directly within the Opal platform.
See Optimizely Opal Chat for information.

Instructions

Instructions are the foundational context, rules, and behavioral guidelines that shape how
Opal creates output and tailors it to your organization's unique needs.
See the Instructions overview for information.

Agents

https://support.optimizely.com/hc/en-us/articles/43183109095949-Get-started-with-Optimizely-Opal-for-agent-builders

3/7

3/31/26, 8:25 PM

Agents complete tasks for you in Opal. They interpret your requests, decide which tools
to use, and deliver consistent results. The Agents page of the Opal App is where you can

### For End Users

End users interact with Opal through the chat interface, using pre-built agents and chatting with AI.

3/31/26, 8:25 PM

Articles in this section

Get started with Optimizely Opal for users
Updated 17 minutes ago

Follow

Optimizely Opal is an agent orchestration platform that helps you work smarter across
Optimizely One. But, before you can access Opal, an Optimizely Administrator must add
you as a user and set your permissions. See Get started with Optimizely Opal for
administrators.

Access the Optimizely Opal app
The Optimizely Opal app is Opal's configuration dashboard, accessible through the
product switcher in the global navigation.
1. Log in to Optimizely.
2. Select your organization.
3. Click Opal.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39478258680333-Get-started-with-Optimizely-Opal-for-users

1/4

3/31/26, 8:25 PM

Opal App UI

The Opal App provides a centralized interface where you can access Opal's capabilities in
one place. The Opal App UI support everything you need to configure, customize, and
use Opal effectively. Each page helps you focus on outcomes while Opal handles the
technical details behind the scenes.

Opal Chat for Opal Users

Chat is the conversational interface for Optimizely Opal. It lets you interact with Opal
using natural language to complete tasks, get insights, and automate workflows without
needing to know the underlying systems or commands.
You can ask Opal questions, make requests, or give instructions, and Opal determines the
right tools and agents to use to deliver accurate, actionable results. Whether you need to
generate content, analyze data, or manage experiments, Opal Chat provides a simple,
intuitive way to work directly within the Opal platform.
See Optimizely Opal Chat for information.

Appearance
Go to Settings > Appearance to configure the Font Size and Theme for your Opal app
experience. These settings are for your individual Opal instance only and do not affect
other users in your organization.

Adjust the font size
https://support.optimizely.com/hc/en-us/articles/39478258680333-Get-started-with-Optimizely-Opal-for-users

2/4

3/31/26, 8:25 PM

Click on the Font Size drop-down list to update the font size Opal uses.

### Enabling Opal for Non-Opti ID Users

Organizations can extend Opal access to users who don't have an Optimizely ID.

3/31/26, 8:26 PM

Articles in this section

Enable Opal for non-Opti ID users
Updated 1 month ago

Follow

Customers who are not on Opti ID can try out Optimizely Opal by having their technical
contact assign access to Opal. This lets them try out Opal before migrating to Opti ID.
This method adds the user to that organization's Opti ID as the home organization.
If you decide to use Opal with a product, that product must migrate to Opti ID.

Prerequisites
Super Admin role assigned in your Organization within the Admin Center (usually the
technical contact). This admin can assign Opal to users within their organization.

Add Opal access to a local user
1. Go to Admin Center > Users.
2. Find the user you want to grant Opal access to. If the user does not have an account
yet, click Invite User and fill out the form with the Email, First Name, and Last Name
for the user.
3. Click Add Product Access for the user and enter the following:

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/40966084694285-Enable-Opal-for-non-Opti-ID-users

1/2

3/31/26, 8:26 PM

Product – Select Opal. The Instance should auto-populate with Opal.
Role – Select the Opal role. See Optimizely Opal roles for information.

4. Click check. If this is a new user, also click Send to send the welcome email.

Previous article
Get started with Optimizely Opal for users

Next article
Optimizely Opal glossary

Still have questions?
Contact us

Optimizely Website
Support Policy
Privacy Notice
Website terms of use
Cookie settings
Trust center
Third-Party Addons & Platforms

---

## Credits System & Reporting

### Understanding Opal Credits

Opal uses a credit-based system to meter and manage usage of AI and agent features.

3/31/26, 8:26 PM

Articles in this section

Optimizely Opal credits
Updated 4 hours ago

Follow

Important
Effective March 12th, 2026 Optimizely may allocate Opal workloads to any of its
approved LLM models. Currently, Optimizely's Opal utilizes Google Gemini's
family of models as its LLM.
As of March 15th, 2026, Opal's LLM models will include Anthropic Claude's family
of models accessed via Google Vertex AI. For the purposes of Optimizely's Data
Processor Agreement, Anthropic will become an Optimizely Sub-processor as
from March 15, 2026. Optimizely reserves the right to add, remove, and/or
substitute Opal's underlying LLMs. All approved LLMs for Opal are detailed in
Optimizely's Software Service Services Description. Optimizely Opal's allocation
of workloads to different LLMs and the associated model will not alter how Opal
credits are consumed from Opal usage.

Optimizely Opal credits are required to use Optimizely Opal.
Important
Effective 3/1/2026, an adjustment to the credit value model will be applied to
all customers with Opal credits. The update ensures that credits utilized
through Opal interactions fall into a fixed number of categories for greater
predictability and forecasting of credit use by customers.
Effective 10/15/2025, an update to credit value is reflected in the Do you
have examples of Opal credits per task? section.
https://support.optimizely.com/hc/en-us/articles/36304551863181-Optimizely-Opal-credits

Privacy - Terms

1/8

3/31/26, 8:26 PM

Effective 9/30/2025, all promotional credits available within customers'
instances reset to zero.
Effective 10/1/2025 and ending on 9/30/2026, each instance of Opal is able
to utilize up to 200 credits monthly on a complimentary basis.
If your usage regularly exceeds your complimentary 200 monthly credits, your
Optimizely account team may reach out to explore a more tailored Opal plan.
Optimizely reserves the right to modify or discontinue complimentary access
at any time.
If you have questions about your usage, credit allocation, or would like to
explore how to get the most out of Optimizely Opal, contact your Optimizely

### Reporting and Analytics

Track Opal usage, agent performance, and system health through Optimizely's reporting.

3/31/26, 8:27 PM

Articles in this section

Optimizely Reporting for Opal
Updated 2 months ago

Follow

Access your dashboards and reports for Optimizely Opal using Optimizely Reporting
through your Opti ID account.

Prerequisites
You need an Opti ID account.
Your Opti ID user account needs a role for an Opal instance.

Site navigation
1. Log in to Optimizely Reporting at the following URL: https://home.optimizely.com/.
2. Select Optimizely Reporting or use the product switcher in the global navigation bar.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/40917478334093-Optimizely-Reporting-for-Opal

1/7

3/31/26, 8:27 PM

3. After you log in, scroll down and click the Opal Agent Usage dashboard for
Optimizely Opal, or select Opal from the Product drop-down list.

View Opal agent usage
The Opal Agent Usage dashboard displays a table that lists the agent IDs ( @names ) in
your product instances and the total number of credits each agent consumed. The
Agents > Setup > Details section in your Opal instance displays the agent ID.

By default, the Opal Agent Usage table displays the total credits agents consumed in the
last seven days. You can search by agent ID to view their individual credit consumption.
This lets you monitor and compare credit usage across agents and plan your Opal credits
usage accordingly. The table also displays the Opal Agent, the primary agent for chat and
feature interaction.

https://support.optimizely.com/hc/en-us/articles/40917478334093-Optimizely-Reporting-for-Opal

2/7

3/31/26, 8:27 PM

Filter data
1. Click Agent ID > is any value, and select one or more agents from the drop-down list.

2. Click Usage Date > Last 7 Days, and choose a time period from the preset time
periods or click Custom to set your own custom time period.

https://support.optimizely.com/hc/en-us/articles/40917478334093-Optimizely-Reporting-for-Opal

3/7

3/31/26, 8:27 PM

3. Click Update. When you adjust the filters, you must click Update again to apply your
new settings.

Reset dashboard filters
To clear the current filter settings and reset to the default filter, click Dashboard actions

---

## Opal Chat Interface

### Chat Overview

The Opal Chat interface is the primary way users interact with AI agents and Opal capabilities.

3/31/26, 8:27 PM

Articles in this section

Optimizely Opal Chat
Updated 29 minutes ago

Follow

Optimizely Opal is an agent orchestration platform that helps you explore complex
questions, provides clear answers about the Optimizely platform, and offers instructions
with links to relevant articles. Opal automates tasks, surfaces insights, and guides
decision-making. Opal adapts its communication style to your technical expertise,
helping you work smarter and complete tasks more efficiently.
Important
Administrators must grant users access to Optimizely Opal.
Opal is enabled by default for eligible customers, but users do not have access
until an administrator enables it for each individual using Opti ID. For steps, see
Get started with Optimizely Opal for Admins.

Click Ask Opal to open Opal Chat, which helps you find information, automate tasks, and
enhance your product experience. See Optimizely Opal Overview for information. To
close Opal Chat, click Ask Opal again or click Close.

Access Opal Chat
Depending on your organization and product access, you can access Opal Chat in several
places across the Optimizely platform.
Opal website – Go to opal.optimizely.com. Opal Chat opens automatically. Use the
Set Product Instance drop-down to choose the product instance you have access to.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/36343492268813-Optimizely-Opal-Chat

1/13

3/31/26, 8:27 PM

Optimizely Admin Center – Go to home.optimizely.com to access the Admin Center.
Select an organization that includes Opal Chat and click Opal.

Global navigation bar – From any product with Opal Chat access, click Ask Opal in
the global navigation bar. See Opal Chat in Optimizely products for a list of supported
Optimizely products.

https://support.optimizely.com/hc/en-us/articles/36343492268813-Optimizely-Opal-Chat

2/13

3/31/26, 8:27 PM

Opal Chat user interface
For a step-by-step walkthrough, see the Opal chat user interface.
How Opal Chat displays varies by entry point and conversation state. The following

### Canvas System

Canvases provide structured, multi-format outputs within the chat interface.

3/31/26, 8:27 PM

Articles in this section

Canvas overview
Updated 1 month ago

Follow

Canvas provides a dynamic and collaborative environment where you and Optimizely
Opal build, customize, and deliver interactive digital assets, applications, and complex
content. This workspace lets you create and manage digital assets in real-time.
A canvas (also called an element) is a building block for your digital experiences. A space
is the entire persistent, version-controlled workspace containing one or more canvases.
One space exists per chat thread.

Supported formats
Opal supports rendering and editing the following MIME types in canvas:
– For documents, briefs, emails, and articles.
text/html – For pure HTML content.
application/x-reactjs – For React components and applications.
application/x-nextjs – For Next.js pages and applications.
text/csv – For comma-separated values (CSV) plain text data formats.
application/vnd.ms-powerpoint – For Microsoft PowerPoint presentations (when
using the create_powerpoint_canvas tool).
text/markdown

Available download formats
You can download the canvas in different file types based on its MIME type.
text/markdown

Microsoft Word – . docx
PDF document – .pdf
Plain text – .txt
Rich text format – .rtf

https://support.optimizely.com/hc/en-us/articles/41120389883277-Canvas-overview

Privacy - Terms

1/8

3/31/26, 8:27 PM

Markdown – .md

text/html

HTML – .html
PDF document – .pdf
Plain text – .txt

application/x-reactjs

JavaScript – .js
JavaScript JSX – .jsx

application/x-nextjs

JavaScript – .js
JavaScript JSX – .jsx

text/csv

Comma Separated Values – .csv
Microsoft Excel – .xlsx
PDF document – .pdf

application/vnd.ms-powerpoint

Microsoft PowerPoint – .pptx
PDF document – .pdf

Canvas UI overview
Canvas provides a responsive UI where functionality changes dynamically based on the
current digital asset's MIME type. This lets you work with Opal in an intuitive editing
experience, offering controls for the specific digital asset at hand. See the Supported
formats section for a list of available MIME types.
text/markdown

Markdown-related canvases display the Markdown in a formatted text format similar to
the following:

https://support.optimizely.com/hc/en-us/articles/41120389883277-Canvas-overview

2/8

3/31/26, 8:27 PM

1. Close the canvas and return to Opal Chat.
2. Switch between canvases in the same space (chat thread).
3. Undo changes in the canvas.
4. Redo changes in the canvas.
5. Copy the raw Markdown.
6. Download the canvas content. See Available download formats.
7. Collaborate with Opal in canvas to modify the Markdown.

### Managing Canvases

Administrators can configure and manage canvas templates and settings.

3/31/26, 8:27 PM

Articles in this section

Manage canvases
Updated 1 month ago

Follow

Canvases, also known as elements, in Optimizely Opal serve as collaborative digital
workspaces. They let you and Opal co-create and refine various digital assets in real-time.
This integrated environment streamlines development, providing features for editing,
version control, and direct Opal assistance across various digital asset types, from
documentation to code. For more information, see the Canvas overview.
Note
See the Canvas section of the System tools overview documentation for a list of
available canvas tools.

Create a canvas
Opal uses the create_canvas tool to create an interactive canvas (element) where you
and Opal can collaboratively edit digital assets in real-time.
You can create a canvas in Opal Chat in the following ways:
Implicitly – By entering a prompt where Opal infers the need for a canvas. For
example, Make an HTML page with a simple contact form.
Explicitly – By entering a prompt that specifically instructs Opal to use the canvas
tool. For example, Make an HTML page with a simple contact form using the canvas
tool.
Directly – By clicking the Edit in canvas button after sending a prompt to Opal that
generates an element, but does not automatically create a canvas or invoke an agent.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/41124981671309-Manage-canvases

1/8

3/31/26, 8:27 PM

Locate the canvas Opal created in its response. It displays as a card with the canvas
name and its MIME type (for example, Simple Contact Form and Text/Html). Click
Expand on the canvas name.

After you click Expand, the canvas opens in a split-screen interface. This page displays
the canvas for editing alongside the Opal Chat, letting you continuously collaborate with
Opal's assistance. See Collaborate with Opal in canvas for next steps.

https://support.optimizely.com/hc/en-us/articles/41124981671309-Manage-canvases

2/8

3/31/26, 8:27 PM

Collaborate with Opal in canvas
After you create your canvas, you can actively collaborate with Opal to refine and

### Prompting Techniques

Effective prompting is key to getting better results from Opal agents and AI.

3/31/26, 8:27 PM

Articles in this section

Opal prompts
Updated 4 months ago

Follow

Prompting is how you communicate with Optimizely Opal in Opal Chat to get accurate,
useful results. The way you phrase your request impacts how well Opal understands and
responds. The following information provides best practices for writing clear, effective
prompts and includes examples to help you structure your requests. Use these
techniques to get better answers, streamline your workflows, and make the most of
Opal's capabilities.

Prompt engineering for Optimizely Opal Chat
Make the most of Optimizely Opal by communicating your requests clearly and
effectively. Prompt engineering involves crafting precise prompts to get the best results.
You can boost Optimizely Opal's ability to support your marketing and product
development work with a few simple principles.

Key principles of effective prompting
Clarity and specificity – Just like giving instructions to a human assistant, clarity and
specificity are crucial for Opal Chat. Avoid vague or ambiguous language. The more
precise you are with your request, the more accurate and relevant Optimizely Opal's
response is.
Instead of – Tell me about marketing.
Try – Generate a list of content marketing strategies for ecommerce businesses

targeting Gen Z.

Context and background – Provide relevant context and background information to
help Optimizely Opal understand your request better. This can include details about
your target audience, campaign objectives, brand guidelines, or specific Optimizely
functionalities you want to utilize.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39479393788813-Opal-prompts

1/4

3/31/26, 8:27 PM

Instead of – Create a campaign brief.
Try – Create a campaign brief for a new product launch targeting millennials, with
a budget of $10,000, focusing on social media channels, and aligning with our
brand's sustainability values.

Desired output format – Specify the desired format for Optimizely Opal's response,
such as a list, a paragraph, a table, or code. This information helps Optimizely Opal

### Supported File Types

Opal can process various file types in the chat interface.

3/31/26, 8:27 PM

Articles in this section

Supported file types in Optimizely Opal
Updated 1 month ago

Follow

Optimizely Opal supports a variety of file types across its feature. Understanding the
supported formats and their associated technical specifications ensures compatibility
and optimal performance when uploading and managing your assets in Opal.
The following sections outline the file types currently supported by Opal, along with
relevant limitations.

Image files
For images, Opal supports the following common web-friendly formats:
.png
.jpeg
.webp

Technical specifications for image files
Maximum images per prompt – 3,000
Maximum image size – 7 MB
Supported MIME types – image/png , image/jpeg , and image/webp .

Document files
For documents, Opal supports the following formats:
.pdf
.txt
.csv
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/40874261840525-Supported-file-types-in-Optimizely-Opal

1/4

3/31/26, 8:27 PM

Technical specifications for document files

Maximum number of files per prompt – 3,000
Maximum number of pages per file – 1,000
Maximum file size per file – 50 MB
Supported MIME types – application/pdf , text/plain , text/csv .

Video files
For video content, Opal supports the following formats:
.3gp
.avi
.flv
.mov
.mpeg
.mp4
.mpg
.webm
.wmv

Technical specifications for videos files
Maximum video length (with audio) – Approximately 45 minutes.
Maximum video length (without audio) – Approximately 1 hour.
Maximum number of videos per prompt – 10.
Supported MIME types
video/3gpp
video/mp4
video/mpeg

---

## External System Integrations

### Opal in Slack

Bring Opal AI capabilities directly into Slack workspaces for seamless team collaboration.

3/31/26, 8:39 PM

Articles in this section

Optimizely Opal in Slack
Updated 1 month ago

Follow

Optimizely Opal for Slack provides direct access to Opal's AI capabilities and Optimizely
product knowledge within your Slack workspace. You can use this integration to chat
with Opal, manage campaigns, analyze experiment results, and execute AI agents, all
without leaving Slack.

Prerequisites
Use Opti ID to access Opal.
Enable generative AI in Optimizely.
Request access to Optimizely Opal in Slack. Contact your Customer Success
Manager.

Add Optimizely Opal to your Slack Workspace
Key features of Optimizely Opal in Slack
Full Opal capabilities in Slack – Access the full power of Opal, backed by its deep
knowledge of Optimizely's product suite and best practices.
Visual content creation – Analyze, generate, and edit images, and take webpage
screenshots with Opal.
Instant insights – Reference Optimizely documentation, gather external web insights,
and get real-time SEO keyword insights right in your conversation.
Mobile productivity – Interact with your content and experiments on the go. The
integration extends Opal's full product suite to the Slack app on your phone or tablet.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39079376496397-Optimizely-Opal-in-Slack

1/12

3/31/26, 8:39 PM

Install Opal in Slack

Important
Your Slack workspace's Owner may require admin approval to add apps. See Add
apps to your Slack workspace for information.
1. Click Add to Slack from the Add Optimizely Opal to your Slack Workspace section to
install Opal in your workspace.
2. Enter your workspace's information and log in to Slack.

3. Click Allow on the permission page.

https://support.optimizely.com/hc/en-us/articles/39079376496397-Optimizely-Opal-in-Slack

2/12

3/31/26, 8:39 PM

Configure Opal in Slack
1. Go to Apps > Optimizely - Opal.
2. Select the Home tab and click Login with Optimizely to complete the connection.

3. Log in to Optimizely. A success message should display. Click Return to Slack.
https://support.optimizely.com/hc/en-us/articles/39079376496397-Optimizely-Opal-in-Slack

3/12

3/31/26, 8:39 PM

4. Click Select Organization.

5. Select your Organization and click Select.

https://support.optimizely.com/hc/en-us/articles/39079376496397-Optimizely-Opal-in-Slack

4/12

3/31/26, 8:39 PM

6. Click Close.

You can now use Opal in Slack.

How to use Opal in Slack
After you install and configure Opal, it integrates directly into your Slack workspace,
letting you have seamless conversations and task execution.
Go to Apps > Optimizely - Opal in your Slack app's sidebar to open the dedicated app.

### Opal in Microsoft Copilot

Integrate Opal with Microsoft Copilot for enterprise AI alignment.

3/31/26, 8:38 PM

Articles in this section

Optimizely Opal in Microsoft Copilot
Updated 3 months ago

Follow

Optimizely Opal for Microsoft Copilot lets you use Opal directly in your Copilot
workspace. You can do everything you can do in Opal Chat, including creating and
managing campaigns, generating and editing images, analyzing experiment results, and
executing AI agents.
Beta
Opal in Microsoft Copilot is in closed beta.

Prerequisites
You must use Opti ID to access Opal.
You must have generative AI enabled in Optimizely.

Install Opal in Copilot
In Microsoft Copilot,
1. Go to the Agent Store.
2. Click the Search agents field and enter Opal.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39828681661453-Optimizely-Opal-in-Microsoft-Copilot

1/11

3/31/26, 8:38 PM

3. Select Optimizely Opal.
4. Review the privacy policy, terms of use, and permissions, and click Add.

5. Opal is added to your Copilot.

https://support.optimizely.com/hc/en-us/articles/39828681661453-Optimizely-Opal-in-Microsoft-Copilot

2/11

3/31/26, 8:38 PM

See Agent installation in Microsoft 365 Copilot for information.

Use Optimizely Opal in Copilot
With Opal in Copilot, you can chat with Opal to research, summarize, and ideate, create
and refine content, manage tasks and campaigns, and analyze experiment results directly
in Copilot.
1. Go to Copilot.
2. Enter a prompt.
1. On your first visit, Opal prompts you to log in.

https://support.optimizely.com/hc/en-us/articles/39828681661453-Optimizely-Opal-in-Microsoft-Copilot

3/11

3/31/26, 8:38 PM

2. Click Login with Optimizely.
3. Enter your Opti ID credentials.

3. Optimizely Opal automatically responds in Copilot.

https://support.optimizely.com/hc/en-us/articles/39828681661453-Optimizely-Opal-in-Microsoft-Copilot

4/11

3/31/26, 8:38 PM

Copilot does not display inline images. Instead, when Opal's message includes an image,
Copilot shows a descriptive text link to the image's URL. Click on the URL to see the
image.

History
Your conversations with Opal are saved in Copilot and the Opal Chat app, so you can
refer back to past chats and continue them across platforms.

In Copilot
https://support.optimizely.com/hc/en-us/articles/39828681661453-Optimizely-Opal-in-Microsoft-Copilot

5/11

3/31/26, 8:38 PM

Note
Chat history listed in Copilot includes chats from all your agents installed in
Copilot, not just Opal.
Copilot keeps a list of your recent conversations so you can return to past work. In the
section labeled Chats, review your recent conversations. Entries are grouped by day (for
example, Today and Yesterday) and display the first line or command from each

### Opal in Google Gemini Enterprise

Extend Opal capabilities through Google Gemini Enterprise integration.

3/31/26, 8:38 PM

Articles in this section

Optimizely Opal in Google Gemini
Enterprise
Updated 3 months ago

Follow

Optimizely Opal is available in Google Cloud's Gemini Enterprise. Opal can leverage the
Agent-to-Agent (A2A) protocol, which lets Opal exchange structured messages with
other AI agents to coordinate complex, multi-step work inside a single workflow across
vendors and frameworks.

Note
A2A is an emerging interoperability standard. Partners and capabilities can
change. Expect rapid iteration across the ecosystem.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39883354766733-Optimizely-Opal-in-Google-Gemini-Enterprise

1/3

3/31/26, 8:38 PM

What you can do

Interoperate across vendors – Connect Opal to third-party agents that implement
A2A without building bespoke tool integrations.
Compose multi-agent workflows – Orchestrate tasks across Opal agents and
external agents to handle scenarios no single agent can manage alone.
Keep security boundaries – Use protocol-level authentication and scoped credentials
so each agent only accesses what it needs.

How it works
Gemini Enterprise exposes vendor-neutral A2A endpoints. Opal sends requests that
include intent, inputs, and context, and the partner agent returns a typed response. Each
request and response pair is a contract. Both sides agree on the message schema, auth
method, and timeouts.

Requirements
Gemini Enterprise access – A Gemini Enterprise project with A2A enabled. Contact
your Gemini Enterprise administrator.
Opal permissions – Access to configure agents and workflows in Opal.
Credentials – A2A authentication details from the partner agent (for example, token
or service account).

Configuration
See the Browse agents with Agents gallery article in the Google documentation for
information on adding Opal to Gemini Enterprise. Or see Optimizely Opal Chat for Gemini
Enterprise to install the Opal agent directly.

Limits and notes
Ecosystem maturity – Not every vendor supports A2A yet; capabilities may vary.
Rate limits – Partners may enforce quotas. Design workflows that queue or degrade
gracefully.
Tool compatibility – You can combine A2A with traditional tool integrations. Use A2A
when a partner agent exists, and use tools when you need direct API control.
Note
If you use Opti ID, administrators can turn off generative AI in the Opti ID Admin
Center. See Turn generative AI off across Optimizely applications.
https://support.optimizely.com/hc/en-us/articles/39883354766733-Optimizely-Opal-in-Google-Gemini-Enterprise

2/3

3/31/26, 8:38 PM

---

## Instructions Framework

### What are Instructions?

Instructions are custom guidelines that shape how Opal agents behave and respond. They provide context, constraints, and behavioral rules.

3/31/26, 8:28 PM

Articles in this section

Instructions overview
Updated 1 day ago

Follow

Instructions are the foundational context, rules, and behavioral guidelines that shape how
Opal creates output and tailors it to your unique needs. A simple form of instructions
could have your company's brand guidelines, ensuring Opal generates on-brand content.
Other common instructions include details about your company's products and services,
target personas, user journey funnel, term-bases, and so on.
A key differentiator for Opal is its ability to dynamically pull and apply these instructions
based on their When to use criteria. This ensures Opal always applies the most relevant
and intelligently tailored guidelines, so Opal adapts its responses and actions precisely to
the current context and your specific requirements.
For a visual walkthrough of instructions, watch the video overview.

Components of an instruction
Each instruction contains the following components:

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/36353487109133-Instructions-overview

1/9

3/31/26, 8:28 PM

1. Name – Acts as a short, descriptive identifier for the instruction, aiding in easy
recognition.
2. Active – Indicates whether the instruction is active in Opal and operational.
3. Core Instructions – Defines the instruction's behavior, including objectives, response
formats, and any constraints. See Core instruction for information.
4. Where to use – Defines the Optimizely product and instance contexts where the
instruction applies. If you do not set a Product and Instance, the instruction applies to
all products.
5. When to use – Defines the conditions that activate the instruction
. See When to use for information.

https://support.optimizely.com/hc/en-us/articles/36353487109133-Instructions-overview

2/9

3/31/26, 8:28 PM

Note
Activate your instruction after configuring it. Opal does not refer to inactive
instructions regardless of their configuration.

Core instruction
Write the Core Instruction as you would write guidance for a new team member. Use the

### Personal Instructions

Personal instructions apply to your individual use of Opal.

**Use Cases:**
- Personal preferences and style guidelines
- Individual workflow customizations
- User-specific constraints and rules
- Private instruction sets

3/31/26, 8:28 PM

Articles in this section

Create a personal instruction
Updated 1 day ago

Follow

Personal instructions let you define how Opal behaves specifically for you. Use them to
capture your preferences, working style, and custom behaviors so Opal consistently
matches how you work. This article covers how to create a personal instruction.
Personal instructions apply only to you.
Note
When both organization-wide and personal instructions apply, personal
instructions take priority.

Access instructions
To access instructions in Opal, complete the following steps:
1. Log in to Optimizely.
2. Select your organization.
3. Click Opal.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/44458153160717-Create-a-personal-instruction

1/5

3/31/26, 8:28 PM

4. Click Instructions.

Create a personal instruction
To add a personal instruction that applies only to your Opal interactions, complete one of
the following options:

From Opal Chat
While chatting with Opal, you can enter Save this as an instruction at any point in the
conversation or click Extract to my instructions to save the instruction.

https://support.optimizely.com/hc/en-us/articles/44458153160717-Create-a-personal-instruction

2/5

3/31/26, 8:28 PM

Important
Ensure the create_or_edit_instruction tool is Active and Enabled in Chat.
See Manage tools for information.

From the Instructions tab
Complete the steps in the Access instructions section and then complete the following:
1. Select the Personal tab.
2. Click Add Instruction.

https://support.optimizely.com/hc/en-us/articles/44458153160717-Create-a-personal-instruction

3/5

3/31/26, 8:28 PM

3. Enter a Name for your instruction.
4. (Optional) Toggle Active on or off.
Toggle Active on to let Opal use your instruction.
Toggle Active off if you do not want Opal to use your instruction. Use this setting
while you develop the instruction.
5. Enter a Core Instruction, which is information and context for Opal to tailor its output.
Include details such as guidelines, response formats, and constraints. You can doubleclick text to add styling. See Core instruction in the Instructions overview

### Organization-Wide Instructions

Organization-wide instructions apply to all Opal users in your organization.

**Use Cases:**
- Brand voice and messaging guidelines
- Company-specific terminology and definitions
- Organizational policies and compliance rules
- Standardized workflows and processes

3/31/26, 8:28 PM

Articles in this section

Create an organization-wide instruction
Updated 1 day ago

Follow

Organization-wide instructions let Optimizely Opal administrators define consistent,
reusable guidance that shapes how Opal responds across your organization. When you
create an instruction, you define the objective, the steps Opal follows, the response
format, and the conditions that activate it. This article covers how to create an instance
instruction.
Note
When both organization-wide and personal instructions apply, personal
instructions take priority.

Access instructions
To access instructions in Opal, complete the following steps:
1. Log in to Optimizely.
2. Select your organization.
3. Click Opal.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/44401621317517-Create-an-organization-wide-instruction

1/5

3/31/26, 8:28 PM

4. Click Instructions.

Create an organization-wide instruction
To add an instruction for the entire organization, complete one of the following options:

From Opal Chat
While chatting with Opal, you can enter Save this as an instruction at any point in the
conversation or click Extract to my instructions to save the instruction.

https://support.optimizely.com/hc/en-us/articles/44401621317517-Create-an-organization-wide-instruction

2/5

3/31/26, 8:28 PM

Important
Ensure the create_or_edit_instruction tool is Active and Enabled in Chat.
See Manage tools for information.

From the Instructions tab
Complete the steps in the Access instructions section and then complete the following:
1. Select the Instance tab.

https://support.optimizely.com/hc/en-us/articles/44401621317517-Create-an-organization-wide-instruction

3/5

3/31/26, 8:28 PM

2. Click Add Instruction.

3. Enter a Name for your instruction.
4. (Optional) Toggle Active on or off.
Toggle Active on to let Opal use your instruction.
Toggle Active off if you do not want Opal to use your instruction. Use this setting
while you develop the instruction.
5. Enter a Core Instruction, which is information and context for Opal to tailor its output.

### Managing Instructions

3/31/26, 8:28 PM

Articles in this section

Manage instructions
Updated 1 day ago

Follow

Instructions are an added level of context that you can provide to tell Optimizely Opal
how to behave and when to run the instruction. Opal evaluates all available instructions
and determines which ones apply to the current task. Opal is not limited to a single
instruction per action. It assesses all applicable instructions, and produces output that
meets the criteria of the prompt you send.
Optimizely Opal comes with prebuilt instructions to help you get started. You can modify
these to match your brand voice and strategy, or you can create simple or detailed
instructions from scratch. For example
Simple – You should ask users for keywords they are targeting when they ask to
generate content.
Detailed – Here is everything about the tone of voice and style you should use when
generating content across all channels.

Access instructions
To access instructions in Opal, complete the following steps:
1. Log in to Optimizely.
2. Select your organization.
3. Click Opal.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/36553454584077-Manage-instructions

1/6

3/31/26, 8:28 PM

4. Click Instructions.

Create instructions
See Create an organization-wide instruction or Create a personal instruction.
Note
When both organization-wide and personal instructions apply, personal
instructions take priority.

https://support.optimizely.com/hc/en-us/articles/36553454584077-Manage-instructions

2/6

3/31/26, 8:28 PM

Modify instructions

To modify an instruction, complete the steps in the Access instructions section and click
on the instruction you want to edit or click More (...) > Edit.

When updating an instruction, you can modify the following:
Name – The name of the instruction.
Core Instruction – The actual behavioral prompt Optimizely Opal uses to generate
content.
Active – If the instruction is on or off.
Where to use – The Optimizely product and instance where Opal should use the
instruction.
When to use – When Opal should apply this instruction.

---

## Tools Ecosystem

### Overview

Tools are integrations that agents can use to interact with external systems. Opal supports three types:

1. **System Tools** - Pre-built integrations with Optimizely products
2. **Connector Tools** - Integration with third-party SaaS services
3. **Custom Tools** - Proprietary integrations you build

3/31/26, 8:33 PM

Articles in this section

Connector tools overview
Updated 11 days ago

Follow

You can use Optimizely Connect Platform (OCP) to add additional connector tools to the
system tools already available in Optimizely Opal.
Beta
Adding tools through OCP is in beta. Contact your Customer Success Manager
for information.

App directory
Optimizely lists the available Opal connector tools in the OCP App Directory. To view only
Opal connector tools, click on Opal in the Works with section.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/40536213498253-Connector-tools-overview

1/4

3/31/26, 8:33 PM

Add connector tools
Installing an app in the OCP App Directory makes its connector tools available in Opal.
During installation, provide any required information, such as authentication details or API
keys. After you configure the integration in OCP, you can register it with Opal. See the
documentation for each integration in the following section for step-by-step
instructions.

Available connector tools
You can add the following connector tools to Opal using OCP:
Amplitude connector tools
Crunchbase connector tools
Figma connector tools
Fullstory connector tools
Google Analytics (GA4) connector tools
Looker connector tools
Profound connector tools
Zapier Remote MCP connector tool
Zoom Webinar connector tools

Troubleshoot connector tools
Why do I not see all the available tools listed in the documentation?
https://support.optimizely.com/hc/en-us/articles/40536213498253-Connector-tools-overview

2/4

3/31/26, 8:33 PM

Optimizely may have released a new version of the connector tools. You can Sync the
connector tools to get the latest version. See Update a tool registry section in the
Manage tools documentation.
Alternatively, you may not have access to all available tools if your organization does
not access to all AI features in the third party app, such as Fullstory. See step six Add
Fullstory Opal Tools in OCP section in the Fullstory connector tools documentation.

Why is my OCP connector failing to connect?

### Managing Tools

Administrators can enable/disable tools, assign permissions, and manage integrations.

3/31/26, 8:29 PM

Articles in this section

Manage tools
Updated 4 days ago

Follow

You can manage Optimizely Opal tools to ensure they align with your operational needs.
By managing these settings, you can optimize tool functionality and integration, ensuring
that Opal and other agents have access to the necessary resources.

Activate or deactivate a tool
When Active is toggled on, the tool is available everywhere. You can use the tool in Opal
Chat and agents can call it. When Active is toggled off, the tool is not available anywhere
in Opal. Opal Chat and agents cannot call it.
1. Go to Tools > Tools.
2. Search for your tool or start entering a name or description in the search text field.
3. (Optional) Use the Provider, Active Status, Enabled in Chat, and Tool Type dropdown lists to filter your tools.
4. Toggle Active on or off for individual tools or an entire tool registry.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39329066565901-Manage-tools

1/6

3/31/26, 8:29 PM

Important
You cannot toggle system tools off.
See the Tools page overview for a summary of the Tools page.

Available in Opal Chat
When Enabled in Chat is toggled on, Opal Chat can use the tool. When Enabled in Chat
is toggled off, Opal Chat cannot call the tool, but agents still can.
Note
You can enable up to 128 tools in an Opal instance at a time.
1. Go to Tools > Tools.
2. Search for your tool or begin entering a name or description of the tool in the search
text field.
3. (Optional) Use the Provider, Active Status, Enabled in Chat, and Tool Type dropdown lists to filter your tools.
4. Toggle Enabled in Chat on or off for individual tools or an entire tool registry.
https://support.optimizely.com/hc/en-us/articles/39329066565901-Manage-tools

2/6

3/31/26, 8:29 PM

See the Tools page overview for a summary of the Tools page.

Update a tool registry
Optimizely may update tools from time to time. Also, if you add additional tools to your
registry, you need to sync it for Opal to access them. To get the latest tools, sync your

---

## System Tools Reference

### System Tools Overview

System Tools are officially maintained integrations with Optimizely products. They provide direct, optimized access to Optimizely platforms.

3/31/26, 8:36 PM

Articles in this section

System tools overview
Updated 1 month ago

Follow

System tools by functionality
System tools are built-in features that help Optimizely Opal take action. Each tool
performs a specific task, such as creating a campaign, uploading files, or generating
images. Think of tools like attachments on a Swiss Army knife. Each one has a distinct
purpose that helps you get work done.
This page lists all built-in system tools provided and maintained by Optimizely, grouped
by functionality, so you can see what actions are available for your workflows.
Additionally, Optimizely maintains tools for specific Optimizely products. See the
following documentation for product-specific tools:
System tools for Campaign
System tools for Configured Commerce
System tools for Content Marketing Platform (CMP)
System tools for Content Management System (SaaS)
System tools for Content Recommendations
System tools for Feature Experimentation
System tools for Optimizely Analytics
System tools for Optimizely Data Platform (ODP)
System tools for Optimizely Graph
System tools for Personalization
System tools for PIM
System tools for Product Recommendations
System tools for Web Experimentation
Note
https://support.optimizely.com/hc/en-us/articles/39340107628429-System-tools-overview

Privacy - Terms

1/6

3/31/26, 8:36 PM

You can ask Opal what tools it has at any time. For example, enter "Please list the
tools you have with a brief description of what they do and the parameters" into
Opal Chat.

Click on a tool's name to expand it and learn more about when to use the tool, required
and optional parameters, and example prompts on how to call the tool. If you do not
provide a required parameter, Opal prompts you for it.

Browse the web
– Opens and extracts content from multiple webpages concurrently and
returns the content in Markdown or HTML format.
browse_web_html – Browses a single webpage, extracts information, and returns
content in raw HTML format.
take_webpage_screenshot – Captures a screenshot of a webpage by given URL.
browse_web

Canvas
Your active canvas provides a dynamic and collaborative environment where you and
Optimizely Opal can build, customize, and deliver interactive digital assets, applications,
and complex content. This workspace lets you create and manage digital assets in realtime.
See Canvas overview for more information.
edit_canvas

operations.

– Edits existing AI canvas (element) content using JSON Patch

– Creates an interactive AI canvas (element) where you and Opal can
collaboratively edit content in real-time. Canvases are versatile and can hold various

### Campaign

Manage marketing campaigns, segments, and execution through Opal.

3/31/26, 8:36 PM

Articles in this section

System tools for Campaign
Updated 1 month ago

Follow

System tools are built-in features that help Optimizely Opal take action. Each tool
performs a specific task, such as creating a campaign, uploading files, or generating
images. Think of tools like attachments on a Swiss Army knife. Each one has a distinct
purpose that helps you get work done.
In addition to the system tools available in Opal, Campaign includes a set of system tools
designed to support getting campaign information. These Opal system tools are grouped
by functionality to make it easier to find the right tool for your workflow.
Note
You can ask Opal what tools it has at any time. For example, enter "Please list the
tools you have with a brief description of what they do and the parameters" into
Opal Chat.
Click a tool's name to expand it and learn when to use it, its required and optional
parameters, and example prompts to calling the tool. If you do not provide a required
parameter, Opal prompts you for it.
campaign_get_smart_campaign

Campaign.

– Retrieves detailed information about a single Smart

campaign_get_smart_campaign_list

Smart Campaigns.

– Retrieves detailed information about a list of

– Retrieves the content of a
specific campaign email message in either plain text or HTML format.
campaign_get_smart_campaign_message_content

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/42021008282765-System-tools-for-Campaign

1/2

3/31/26, 8:36 PM

campaign_get_smart_campaign_messages

associated with a specific Smart Campaign.

– Retrieves a list of all messages

– Generates a detailed report for a Smart
Campaign, including statistics on recipients, bounces, unsubscribes, opens, and clicks.
campaign_get_smart_campaign_report

Previous article
System tools overview

Next article
System tools for Configured Commerce

Still have questions?
Contact us

Optimizely Website
Support Policy
Privacy Notice
Website terms of use
Cookie settings
Trust center
Third-Party Addons & Platforms
English (United States)

https://support.optimizely.com/hc/en-us/articles/42021008282765-System-tools-for-Campaign

### Configured Commerce

Manage products, inventory, orders, and customer data in ecommerce systems.

3/31/26, 8:36 PM

Articles in this section

System tools for Configured Commerce
Updated 1 month ago

Follow

System tools are built-in features that help Optimizely Opal take action. Each tool
performs a specific task, such as creating a campaign, uploading files, or generating
images. Think of tools like attachments on a Swiss Army knife. Each one has a distinct
purpose that helps you get work done.
In addition to the system tools available in Opal, Optimizely Configured Commerce
includes a set of system tools designed to help you interact with the Admin Console,
such as analyzing your site's error logs or retrieving information about a product or
customer order.
Note
You can ask Opal what tools it has at any time. For example, enter "Please list the
tools you have with a brief description of what they do and the parameters" into
Opal Chat.
Click a tool's name to expand it and learn when to use it, its required and optional
parameters, and example prompts to calling the tool. If you do not provide a required
parameter, Opal prompts you for it.
– Lets you make proxy calls to Optimizely Commerce
Admin API endpoints. This is useful when you need to interact with the Commerce Admin
API using custom HTTP methods, parameters, and request bodies.
cfg_commerce_get_carts – Retrieves detailed information about active and
abandoned carts.
cfg_commerce_get_order – Gets orders by order numbers or OData filters.
cfg_commerce_api_proxy

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/41787261663117-System-tools-for-Configured-Commerce

1/2

3/31/26, 8:36 PM

cfg_commerce_get_product

– Retrieves detailed information about products.

Note
If you use Opti ID, administrators can turn off generative AI in the Opti ID Admin
Center. See Turn generative AI off across Optimizely applications.

Note

Previous article
System tools for Campaign

Next article
System tools for Content Marketing
Platform (CMP)

Still have questions?
Contact us

Optimizely Website
Support Policy
Privacy Notice
Website terms of use
Cookie settings
Trust center

### Content Management System (SaaS)

Create, manage, and publish digital content across channels.

3/31/26, 8:36 PM

Articles in this section

System tools for Content Management
System (SaaS)
Updated 1 month ago

Follow

System tools are built-in features that help Optimizely Opal take action. Each tool
performs a specific task, such as creating a campaign, uploading files, or generating
images. Think of tools like attachments on a Swiss Army knife. Each one has a distinct
purpose that helps you get work done.
In addition to the system tools available in Opal, Optimizely Content Management
System (CMS) (SaaS) includes a set of system tools to help you with CMS-related tasks,
such as managing content.
Note
You can ask Opal what tools it has at any time. For example, enter "Please list the
tools you have with a brief description of what they do and the parameters" into
Opal Chat.
Click a tool's name to expand it and learn when to use it, its required and optional
parameters, and example prompts to calling the tool. If you do not provide a required
parameter, Opal prompts you for it.

Content types
Content types act as blueprints for your content, specifying what kind of data each piece
of content can hold. For example, a "News Article" content type might have fields for
title, body, author, and publish date.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39682866313613-System-tools-for-Content-Management-System-SaaS

1/4

3/31/26, 8:36 PM

– Gets a list of content types, excluding properties, from
CMS (SaaS). This tool provides an overview of the available content structures you can
use, without providing the full details of each property.
cms_get_content_type_details – Gets the full details of a content type, including
properties, from CMS (SaaS).
cms_create_content_type – Creates a new content type in CMS (SaaS).
cms_delete_content_type – Performs a non-disruptive deletion of a content type in
CMS (SaaS).
cms_update_content_type – Updates an existing content type in CMS (SaaS) using a
JSON Merge Patch algorithm.
cms_list_content_types

Content items
Tools labeled Preview are not available in Opal Chat by default and are in beta. Contact

### Content Marketing Platform (CMP)

Orchestrate marketing content across teams and channels. Includes RAG capabilities for content search and retrieval.

3/31/26, 8:36 PM

Articles in this section

System tools for Content Marketing
Platform (CMP)
Updated 1 month ago

Follow

System tools are built-in features that help Optimizely Opal take action. Each tool
performs a specific task, such as creating a campaign, uploading files, or generating
images. Think of tools like attachments on a Swiss Army knife. Each one has a distinct
purpose that helps you get work done.
In addition to the system tools available in Opal, Optimizely Content Marketing Platform
(CMP) includes a set of system tools designed to support content planning and
production. These Opal system tools are grouped by functionality to make it easier to
find the right tool for your workflow.
Note
You can ask Opal what tools it has at any time. For example, enter "Please list the
tools you have with a brief description of what they do and the parameters" into
Opal Chat.
Click a tool's name to expand it and learn when to use it, its required and optional
parameters, and example prompts to calling the tool. If you do not provide a required
parameter, Opal prompts you for it.

Create
create_article_in_task

– Creates an article inside a task in CMP.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39681551954957-System-tools-for-Content-Marketing-Platform-CMP

1/5

3/31/26, 8:36 PM

– Proposes new campaigns for CMP based on the prompt,
conversation history, and existing campaign brief (if creating a sub-campaign).
create_campaign_from_work_request – Creates a campaign in Opal based on an
existing work request.
create_event – Creates an event in CMP to track important dates and activities.
create_library_folder – Creates a folder in the CMP library to organize assets and
content. Folders support nesting by specifying a parent folder ID.
create_milestone – Creates a new milestone within a specified campaign or project
in CMP.
create_task – Creates a single task suggestion for a specified CMP campaign.
create_tasks – Suggests multiple tasks for a CMP campaign based on prompt, chat
history, and campaign brief.

### Content Recommendations

Deliver personalized content recommendations using AI and machine learning.

3/31/26, 8:36 PM

Articles in this section

System tools for Content
Recommendations
Updated 1 month ago

Follow

System tools are built-in features that help Optimizely Opal take action. Each tool
performs a specific task, such as creating a campaign, uploading files, or generating
images. Think of tools like attachments on a Swiss Army knife. Each one has a distinct
purpose that helps you get work done.
In addition to the system tools available in Opal, Optimizely Content Recommendations
includes a set of system tools designed to help you find high-performing content items
and topics and analyze recommendation widget performances.
Note
You can ask Opal what tools it has at any time. For example, enter "Please list the
tools you have with a brief description of what they do and the parameters" into
Opal Chat.
Click a tool's name to expand it and learn when to use it, its required and optional
parameters, and example prompts to calling the tool. If you do not provide a required
parameter, Opal prompts you for it.
To enable the Content Recommendations tools, go to Connections > Content
Recommendations and select one or more product instances. When you enter a prompt
in Chat, select the instance from the Set Product Instance drop-down list to get data for
that instance. You can access data for the past 30 days.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/41743767534477-System-tools-for-Content-Recommendations

1/2

3/31/26, 8:36 PM

– Retrieves the highest-performing content items ranked
by user interactions within a specified date range. Helps identify which articles, posts, or
content pieces resonate most with your audience.
contentrecs_top_topics – Retrieves performance metrics for the most engaging
topics based on user interactions. Identifies trending topics and reveals which topics
resonate most with your audience.
contentrecs_top_recommendation_widgets – Analyzes recommendation widget
performance with detailed A/B testing metrics comparing personalized and
unpersonalized recommendations.

### Feature Experimentation

Design, run, and analyze A/B tests and feature rollouts.

3/31/26, 8:36 PM

Articles in this section

System tools for Feature Experimentation
Updated 1 month ago

Follow

System tools are built-in features that help Optimizely Opal take action. Each tool
performs a specific task, such as creating a campaign, uploading files, or generating
images. Think of tools like attachments on a Swiss Army knife. Each one has a distinct
purpose that helps you get work done.
In addition to the system tools available in Opal, Optimizely Feature Experimentation
includes a set of system tools designed to help you improve your experimentation
program.
Note
You can ask Opal what tools it has at any time. For example, enter "Please list the
tools you have with a brief description of what they do and the parameters" into
Opal Chat.
Click a tool's name to expand it and learn when to use it, its required and optional
parameters, and example prompts to calling the tool. If you do not provide a required
parameter, Opal prompts you for it.

Experimentation context
Note
Opal cannot look up detailed results for a specific experiment you ask about
by name. However, it can show your top-performing and underperforming
https://support.optimizely.com/hc/en-us/articles/39681583418125-System-tools-for-Feature-Experimentation

Privacy - Terms

1/3

3/31/26, 8:36 PM

experiments with their lift and significance data. For full experiment results,
use the Optimizely Experiment Results page.
The feature is not connected to the Optimizely Analytics product. Opal does
not have access to Analytics explorations or custom analyses.
Results data support is still evolving. While Opal can surface high-level
performance information, deeper results integration is still in progress.

– Retrieves detailed schemas for various Optimizely entities
relevant to Feature Experimentation.
exp_execute_query – Executes a template-based query to fetch specific data from
your Optimizely Feature Experimentation instance. It lets you retrieve detailed
information about various entities such as feature flags, rules, environments, attributes,

### Optimizely Analytics

Access web and commerce analytics data for reporting and insights.

3/31/26, 8:36 PM

Articles in this section

System tools for Optimizely Analytics
Updated 1 month ago

Follow

System tools are built-in features that help Optimizely Opal take action. Each tool
performs a specific task, such as creating a campaign, uploading files, or generating
images. Think of tools like attachments on a Swiss Army knife. Each one has a distinct
purpose that helps you get work done.
Optimizely Analytics provides system tools to help you with Analytics-related tasks, in
addition to the system tools already available in Opal.
Note
You can ask Opal what tools it has at any time. For example, enter "Please list the
tools you have with a brief description of what they do and the parameters" into
Opal Chat.
Click a tool's name to expand it and learn when to use it, its required and optional
parameters, and example prompts to calling the tool. If you do not provide a required
parameter, Opal prompts you for it.

Exploration creation tools
– Lets you get insights and data from a specific exploration in
Optimizely Analytics. You can use it for explorations you have just created or ones you
have previously saved.
oa_create_explore – Constructs and saves a Funnel, Retention, or Event
Segmentation exploration in Optimizely Analytics.
oa_analyze_explore

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/40389153505933-System-tools-for-Optimizely-Analytics

1/3

3/31/26, 8:36 PM

– Searches for analytics entities (also known as properties or
attributes) based on a natural language query within Optimizely Analytics.
oa_find_events – Searches for and returns a list of analytics events based on a
natural language query.
oa_find_explores – Helps you find existing saved explorations in Optimizely
Analytics by using AI to understand your request and find relevant explorations even if
your wording is slightly different from the saved name.
oa_find_entities

Data retrieval
– Searches and lists available datasets in Optimizely Analytics. It
uses fuzzy matching on dataset names and semantic search on descriptions to find

### Optimizely Data Platform (ODP)

Work with customer data, segments, and identity resolution.

3/31/26, 8:37 PM

Articles in this section

System tools for Optimizely Data Platform
(ODP)
Updated 1 month ago

Follow

System tools are built-in features that help Optimizely Opal take action. Each tool
performs a specific task, such as creating a campaign, uploading files, or generating
images. Think of tools like attachments on a Swiss Army knife. Each one has a distinct
purpose that helps you get work done.
In addition to the system tools available in Opal, Optimizely Data Platform (ODP) includes
a set of system tools designed to support getting campaign information.
Note
You can ask Opal what tools it has at any time. For example, enter "Please list the
tools you have with a brief description of what they do and the parameters" into
Opal Chat.
Click a tool's name to expand it and learn when to use it, its required and optional
parameters, and example prompts to calling the tool. If you do not provide a required
parameter, Opal prompts you for it.
– Suggests new real-time audiences you can create in ODP
based on your existing schema.
odp_get_audience_list – Returns the list of existing real-time audience IDs within
the connected ODP instance. See the Connections section in the Get started with
Optimizely Opal for administrators.
odp_get_audience_by_id – Retrieves the full configuration and metadata for a
specific real-time audience.
suggest_odp_audiences

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/42165689708813-System-tools-for-Optimizely-Data-Platform-ODP

1/2

3/31/26, 8:37 PM

create_odp_audiences

description.

– Creates a real-time audience based on a natural-language

Previous article
System tools for Optimizely Analytics

Next article
System tools for Optimizely Graph

Still have questions?
Contact us

Optimizely Website
Support Policy
Privacy Notice
Website terms of use
Cookie settings
Trust center
Third-Party Addons & Platforms
English (United States)

https://support.optimizely.com/hc/en-us/articles/42165689708813-System-tools-for-Optimizely-Data-Platform-ODP

2/2



### Optimizely Graph

Query content and commerce data through a unified GraphQL API.

3/31/26, 8:37 PM

Articles in this section

System tools for Optimizely Graph
Updated 1 month ago

Follow

System tools are built-in features that help Optimizely Opal take action. Each tool
performs a specific task, such as creating a campaign, uploading files, or generating
images. Think of tools like attachments on a Swiss Army knife. Each one has a distinct
purpose that helps you get work done.
In addition to the system tools available in Opal, Optimizely Graph includes a set of
system tools to help you with Content Management System-related tasks, such as
managing content.
Note
You can ask Opal what tools it has at any time. For example, enter "Please list the
tools you have with a brief description of what they do and the parameters" into
Opal Chat.
Click a tool's name to expand it and learn when to use it, its required and optional
parameters, and example prompts to calling the tool. If you do not provide a required
parameter, Opal prompts you for it.
Note
The Optimizely Graph tools are available for CMS (SaaS) and CMS 12 for users
who also have Optimizely Graph.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43110435569805-System-tools-for-Optimizely-Graph

1/2

3/31/26, 8:37 PM

– Use as your starting point for understanding the
content structure within your Optimizely Graph instance. The tool lets you and Opal
discover available content types and their fields, which is crucial for constructing
accurate GraphQL queries.
graph_content_graphql_executor – Execute custom GraphQL queries against your
Optimizely Graph instance. You can retrieve specific content items, filter results, sort, and
get aggregated data (facets).
graph_content_search_tool – Use as a simpler alternative for searching content in
Optimizely Graph when constructing complex GraphQL queries might be excessive. It
lets you search for content based on a search phrase across a specified content type.
graph_content_type_schema

Previous article
System tools for Optimizely Data Platform
(ODP)

Next article
System tools for Personalization

---

## Connector Tools

### What are Connector Tools?

Connector Tools integrate third-party SaaS applications and services into Opal. They enable agents to access external systems for reading and writing data.

3/31/26, 8:33 PM

Articles in this section

Connector tools overview
Updated 11 days ago

Follow

You can use Optimizely Connect Platform (OCP) to add additional connector tools to the
system tools already available in Optimizely Opal.
Beta
Adding tools through OCP is in beta. Contact your Customer Success Manager
for information.

App directory
Optimizely lists the available Opal connector tools in the OCP App Directory. To view only
Opal connector tools, click on Opal in the Works with section.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/40536213498253-Connector-tools-overview

1/4

3/31/26, 8:33 PM

Add connector tools
Installing an app in the OCP App Directory makes its connector tools available in Opal.
During installation, provide any required information, such as authentication details or API
keys. After you configure the integration in OCP, you can register it with Opal. See the
documentation for each integration in the following section for step-by-step
instructions.

Available connector tools
You can add the following connector tools to Opal using OCP:
Amplitude connector tools
Crunchbase connector tools
Figma connector tools
Fullstory connector tools
Google Analytics (GA4) connector tools
Looker connector tools
Profound connector tools
Zapier Remote MCP connector tool
Zoom Webinar connector tools

Troubleshoot connector tools
Why do I not see all the available tools listed in the documentation?
https://support.optimizely.com/hc/en-us/articles/40536213498253-Connector-tools-overview

2/4

3/31/26, 8:33 PM

Optimizely may have released a new version of the connector tools. You can Sync the
connector tools to get the latest version. See Update a tool registry section in the
Manage tools documentation.
Alternatively, you may not have access to all available tools if your organization does
not access to all AI features in the third party app, such as Fullstory. See step six Add
Fullstory Opal Tools in OCP section in the Fullstory connector tools documentation.

Why is my OCP connector failing to connect?

### Available Connectors

Opal connects to hundreds of popular business applications.

3/31/26, 8:33 PM

Articles in this section

Connectors page overview
Updated 1 day ago

Follow

The Connectors page lets you authorize your personal third-party accounts with
Optimizely Opal. Opal Administrators control which connectors and remote Model
Context Protocols (MCPs) are available to the organization. Individual users then
authenticate their personal accounts to let Opal act on their behalf using their specific
permissions, data access, and identity.

For Opal administrators
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/44213835155981-Connectors-page-overview

1/6

3/31/26, 8:33 PM

Opal Administrators manage connector and remote MCP availability for the entire
organization. There are the following levels of configuration:
OCP connector tools – Apps installed to Opal through the Optimizely Connect
Platform (OCP) App Directory. See Add OCP connector tools.
Remote MCPs – External servers that communicate with Opal through MCP. See Add
a remote MCP.
After an Opal Administrator enables them, both types display as tiles on
the Connectors tab. Users can then connect to authenticate with the third-party
provider.

Admin visibility into user connections
Opal Administrators cannot currently view which users in their organization have
authenticated a connector. Individual connections are private to each user.

Add OCP connector tools
Some connector tools require installation OCP before users can authenticate with them.
This is a one-time configuration per connector.
Once installed, the connector tile appears on the Connectors tab for users to
authenticate with their personal accounts.
See the following documentation for connector tools that support user-level
authentication:
Adobe Analytics connector tools
Google Ads connector tools
Microsoft Graph connector tools (Depending on configuration)
Salesforce CRM connector tools
WordPress connector tools
To remove a connector tool, see Delete a tool registry. Removing a connector tool
disables it for the entire organization. Users who have already authenticated with the tool
lose access immediately, and the connector tile no longer appears on the Connectors
tab.

Add a remote MCP
Remote MCPs extend Opal's capabilities by connecting to external MCP servers that
Optimizely has approved. Once you add a remote MCP, a tile becomes available on the
Connectors tab for users in the organization to authenticate.

https://support.optimizely.com/hc/en-us/articles/44213835155981-Connectors-page-overview

2/6

3/31/26, 8:33 PM

See the following documentation for connector tools available through MCP that provide

---

## Custom Tools Development

### What are Custom Tools?

Custom Tools let you build proprietary integrations with your internal systems, APIs, and business logic.

**When to Use Custom Tools:**
- Integrating proprietary internal systems
- Connecting to legacy applications
- Building business-logic-specific tools
- Integrating with custom APIs
- Wrapping complex domain logic

3/31/26, 8:32 PM

Articles in this section

Custom tools overview
Updated 3 months ago

Follow

Optimizely Opal includes powerful default functionality, but every business has unique
needs, proprietary systems, and specialized workflows that generic solutions cannot fully
address. Custom tools help fill these gaps.
Note
Review the System tools before building a custom tool to avoid duplicating
existing functionality.
Building custom tools lets you complete tasks like the following:
Extend Opal's capabilities – Extend what Opal can do by adding tools that execute
actions or pull information from other services, such as exporting a chat to PDF or
calculating experiment runtime.
Integrate with your existing systems – Connect Opal with critical business systems
like Customer Relationship Management (CRM) platforms, Enterprise Resource
Planning (ERP) systems, analytics tools, data warehouses, or third-party marketing
services.
Automate tasks – Automate repetitive marketing and development tasks. Tools let
Opal run workflows based on inputs or conditions, reducing manual effort and errors.
Examples include performing calculations, manipulating data, or generating content
like images, charts, or formatted documents.
Enhance user experience – Enhance Opal's responses and actions by making them
more accurate, contextual, and personalized. This reduces manual workarounds and
switching between Opal and other systems.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39189641171981-Custom-tools-overview

1/2

3/31/26, 8:32 PM

Scale and customize – Scale and customize Opal to fit your organization’s unique
needs and goals.

See Create custom tools for next steps.
Note
If you use Opti ID, administrators can turn off generative AI in the Opti ID Admin
Center. See Turn generative AI off across Optimizely applications.

Previous article
Figma connector tools

Next article
Create custom tools

Still have questions?
Contact us

Optimizely Website
Support Policy
Privacy Notice
Website terms of use
Cookie settings
Trust center
Third-Party Addons & Platforms

### Building Custom Tools

#### Architecture and Standards

Custom tools are defined using a standard schema that describes:
- Tool name and description
- Input parameters and schemas
- Authentication mechanisms
- API endpoint or implementation
- Output formats and examples

3/31/26, 8:32 PM

Articles in this section

Create custom tools
Updated 5 hours ago

Follow

While Optimizely Opal includes a powerful set of system tools, every business has unique
needs, proprietary systems, and specific workflows that generic solutions cannot fully
address. Custom tools let you extend Opal to help with your organization's specific use
cases and needs.

How custom tools work
Before you start building custom tools, you should understand the fundamental concepts
of how Opal discovers, manages, and interacts with custom tools. The following
concepts form the foundation of the tool integration.

Tool manifest
The tool manifest is a structured declaration (often a JSON object) that describes your
tool to Opal. Think of it like a blueprint or a resume for your tool. It tells Opal what your
tool does and how to use it.
The tool manifest includes the following:
Name and description – Human-readable label and summary of your tool.
Parameters – The inputs your tool expects, including name, data type (string, number,
boolean, array, or object), description, and whether they are required.
Execution details – Information about the HTTP endpoint (URL) and method (GET or
POST) Opal uses to execute your tool.
Authentication requirements – Details about any authentication needed to access
your tool.
If you use an Opal tool creation SDK, much of the manifest creation is automated.
Understanding the manifest is still helpful for debugging or ensuring that Opal can
https://support.optimizely.com/hc/en-us/articles/39190444893837-Create-custom-tools

Privacy - Terms

1/6

3/31/26, 8:32 PM

correctly discover and execute your tool.

Discovery endpoints
The discovery endpoint is a specific HTTP endpoint (commonly /discovery ) that
returns your tool manifest and is exposed by your tool service. When you register a
custom tool, Opal calls this endpoint to dynamically discover the tools your service
provides.
If this endpoint is inaccessible, returns errors, or provides a malformed manifest, Opal is
not able to find or use your tools. The Opal tool creation SDKs automate the creation and
management of this endpoint.

Tool execution
After discovery, Opal can run your tool by sending a request to its execution endpoint.
Typically, this is a POST request with a JSON body containing the input parameters.
Your tool processes the request, performs the task, and sends back a response, usually as
JSON. Understanding this request and response flow is key to building reliable tools.
This is the actual "work" phase. Understanding the request and response format is crucial
for implementing your tool's core logic.

Authentication
Authentication verifies that the request to your tool is coming from a trusted source. This
protects your data and systems from unauthorized access.
Important
Opal supports only Opti ID for tool authentication. Optimizely is working on
releasing support for additional providers.
Common methods include the following:
Bearer Tokens – Opal sends a secret token in the Authorization header (for
example, Bearer YOUR_SECRET_TOKEN ), and your tool validates it.

### Adding Custom Tools to Opal

#### Integration Steps

Once you've built a custom tool, add it to Opal:

3/31/26, 8:32 PM

Articles in this section

Add a custom tool to Optimizely Opal
Updated 1 month ago

Follow

After creating a custom tool, you must add it to Optimizely Opal. Your tool must be
hosted on a publicly accessible URL so Opal can connect to it.
You can host your tool yourself or use Optimizely Connect Platform (OCP), which
provides integrated hosting and seamless deployment with the Optimizely ecosystem.

Host options
Self-host
You can host your tool on any platform with a public URL, including Vercel, Netlify,
Amazon Web Services, Azure, Google Cloud Platform, or your own self-managed servers.
The only requirement is that your tool's /discovery endpoint is publicly accessible. See
Deploy your self-hosted custom tool for steps to add your tool to Opal.

Host with OCP
OCP provides a managed environment for hosting custom tools. It simplifies deployment,
handles infrastructure, and lets you publish your tool in the Optimizely App Directory.
In OCP, Opal tools are implemented as OCP Functions, which are event-driven services
triggered by HTTP requests, usually from the Opal AI Assistant. You focus on your tool's
logic while OCP manages scaling and reliability.
See Deploy your custom tool with OCP for steps.

Deploy your self-hosted custom tool
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39195307678221-Add-a-custom-tool-to-Optimizely-Opal

1/7

3/31/26, 8:32 PM

Initial configuration

Before adding your tool to Opal, ensure it has an HTTP endpoint
(commonly /discovery ) exposed. See Create custom tools for guidance.

Register your tool in Optimizely Opal
1. Go to Tools > Registries in your Opal account.
2. Click Add tool registry.

3. Enter a Registry Name.
4. Enter your tool's discovery HTTP endpoint in the Discovery URL field.
5. (Optional) Enter your authentication information in the Bearer Token (Optional) field
if you configured custom bearer token authentication or OAuth for your tool.
6. Click Save.

https://support.optimizely.com/hc/en-us/articles/39195307678221-Add-a-custom-tool-to-Optimizely-Opal

2/7

3/31/26, 8:32 PM

Your Opal tools are now discoverable and available for use within Opal.

Deploy your custom tool in OCP
Prerequisites
An OCP developer account.
A configured OCP development environment, including the OCP Command Line
Interface (CLI).
An initialized Git repository for your Opal tool project.
A completed Opal tool. See Create custom tools for instructions.

Project configuration
1. Clone the Opal tool sample app GitHub repository or download its ZIP file.
2. Use the OCP CLI to register your application. Run the following command:

### Custom Tools FAQ

3/31/26, 8:32 PM

Articles in this section

Custom tools FAQ
Updated 3 months ago

Follow

If your custom Optimizely Opal tool is not functioning as expected, it is often due to
problems with the tool manifest or discovery process. The following FAQs cover common
causes and how to address them.

Why is my tool not working in Opal?
Opal relies on your tool manifest and discovery endpoint to understand and register your
tool. If either is misconfigured, Opal may not correctly identify your tool or its capabilities.
Check for the following common issues.

What happens if my tool parameters are defined
incorrectly?
Incorrect parameter definitions can prevent Opal’s AI from using your tool effectively.
Examples include the following:
Using the wrong data type (for example, defining a parameter as a string when it
should be a number).
Not marking required parameters as required.
Writing unclear or ambiguous descriptions.
When parameter definitions are inaccurate, users might enter invalid inputs, causing
runtime errors.
Solution – Review each parameter’s name, type, description, and required status to
ensure they accurately reflect the tool's expected inputs.

Why can Opal not discover my tool?
https://support.optimizely.com/hc/en-us/articles/39328039415437-Custom-tools-FAQ

Privacy - Terms

1/3

3/31/26, 8:32 PM

Opal discovers tools through the /discovery endpoint. If this endpoint is inaccessible,
Opal cannot find or register your tool. Common issues include the following:
The endpoint is not publicly accessible.
The endpoint returns HTTP errors, such as 404 Not Found or 500 Internal Server
Error.
There are misconfigurations, such as Cross-Origin Resource Sharing (CORS)
problems.
Solution – Ensure your service exposes a working /discovery endpoint and verify that it
can be reached from the Optimizely environment.

What causes a malformed manifest error?
A malformed manifest prevents Opal from registering your tool. Typical causes include
the following:
Having syntax errors in the JSON file.
Missing critical fields.
Using an incorrect schema.

---

## Agent Architecture

### Agent Types

Opal supports three types of agents:

1. **Optimizely-Managed Agents** - Pre-built agents from the Agent Directory
2. **Specialized Agents** - Custom AI agents you create with custom prompts
3. **Workflow Agents** - Multi-step automation agents with triggers and conditions

3/31/26, 8:29 PM

Articles in this section

Agent overview
Updated 1 month ago

Follow

Agents are like intelligent assistants within Optimizely Opal. They use natural language
instructions and tools to complete tasks on your behalf. Each agent has a specific
purpose, whether that is generating content, analyzing data, or automating workflows.
Think of agents as skilled team members. Tools are what they use to take action.
Instructions are the guidelines that tell them how and when to act. Agents combine both
to deliver outcomes without requiring you to manage the technical details.
With agents, you can make simple requests like, "Draft a social post for our product
launch" or "Summarize experiment results", and Opal selects the right tools and follow the
right instructions to get it done.
For a visual walkthrough of agents, watch the video overview.

Why agents matter
Agents are what make Opal powerful and flexible. Instead of having to know which tool
to run or how to structure a request, you simply describe what you want in natural
language. The agent does the rest, ensuring tasks are completed consistently and
accurately.
Without agents, you would need to manually
Configure tools for each task.
Write detailed prompts every time you make a request.
Understand the underlying systems or APIs.
With agents, you get repeatable, optimized workflows that you can customize to your
organization's needs.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39407442255245-Agent-overview

1/4

3/31/26, 8:29 PM

Types of agents

Agents in the Agent Directory
Agents in the Agent Directory are pre-built by Optimizely and come ready to use. These
agents handle common tasks like reviewing content for tone and style, generating
competitive insights, or providing customer support responses.
You can browse and add default agents from the Agent Directory. Each listing includes:
Description – What the agent does and when to use it.
Tools included – The built-in tools the agent can call.
Configuration options – Settings you can adjust for your organization.
Agents from the Agent Directory are the fastest way to get started because they are
ready to run without custom development.
See Agents in the Agent Directory for a list of available agents.

Specialized agents
Specialized agents are custom-built for your organization. They are designed to execute
specific, well-defined tasks using your own tools, data, and instructions.
With specialized agents, you can
Build tailored workflows for unique business processes.
Control which tools the agent can access.

### Managing Agents

3/31/26, 8:41 PM

Articles in this section

Manage agents
Updated 1 month ago

Follow

Agents in Optimizely Opal are purpose-built AI agents that complete specific, welldefined tasks. They operate in a single-shot model. You provide inputs, the agent runs
once, and it returns a result.
In Opal, Opal Administrators can create, customize, and manage agents using prompts,
input variables, tools, and creativity settings to automate tasks accurately and efficiently.

Access your agents
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

4. Click Agents.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39133106856205-Manage-agents

1/3

3/31/26, 8:41 PM

5. Select the Your Agents tab.

Create an agent
See Create specialized agents or Create a workflow agent depending on what type of
agent you want to create.

Use an agent
Agents can be used in the following ways:
Triggered by @ mention in Opal Chat.
Triggered within a workflow agent.

Edit an agent
See Manage specialized agents or Manage workflow agents.
Note
https://support.optimizely.com/hc/en-us/articles/39133106856205-Manage-agents

2/3

3/31/26, 8:41 PM

If you use Opti ID, administrators can turn off generative AI in the Opti ID Admin
Center. See Turn generative AI off across Optimizely applications.

Previous article

Next article

Agent overview

Agent Directory overview

Still have questions?
Contact us

Optimizely Website
Support Policy
Privacy Notice
Website terms of use
Cookie settings
Trust center
Third-Party Addons & Platforms
English (United States)

https://support.optimizely.com/hc/en-us/articles/39133106856205-Manage-agents

3/3



---

## Pre-built Agent Directory

### Agent Directory Overview

The Agent Directory is a curated collection of pre-built agents optimized for specific tasks and use cases.

3/31/26, 8:40 PM

Articles in this section

Agent Directory overview
Updated 11 days ago

Follow

The Agent Directory is a central hub where you can browse, view, and install agents for
Optimizely Opal. Each agent helps with a specific task, such as reviewing content,
analyzing data, or generating marketing copy. The directory provides descriptions,
capabilities, and configuration details so you can find agents that fit your organization’s
needs.
Note
Opal Administrators, Agent Builders, and users with the Add, edit, and install
specialized agents attribute for a custom role can add agents to their
organization's Optimizely Opal instance. See Add users and set permissions.

Access the Agent Directory
1. Log in to Optimizely.
2. Select your org.
3. Click Opal.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39295797340045-Agent-Directory-overview

1/5

3/31/26, 8:40 PM

4. Click Agents > Agent Directory.

Browse agents
In the Agent Directory, you can browse agents by their use cases or use the search bar
to find a specific agent by name or description. The following sections explore the Agent
Directory's icons.

New agents
Agents recently released by Optimizely to the Agent Directory display a New badge.

Installed agents
https://support.optimizely.com/hc/en-us/articles/39295797340045-Agent-Directory-overview

2/5

3/31/26, 8:40 PM

Agents you or someone in your organization have already installed in your Opal instance
display a green check mark badge.

New version available
Optimizely periodically releases new versions of the agents available in the Agent
Directory. Agents that are already installed in your Opal instance and have a new version
available display a blue refresh badge.
You must manually update the agent. To get the latest updates, click on the agent and
then click Update Agent.

Add an agent to Opal
Prerequisites
You must have admin permissions for your Opal instance.
https://support.optimizely.com/hc/en-us/articles/39295797340045-Agent-Directory-overview

3/5

3/31/26, 8:40 PM

Your organization must have generative AI enabled.

### Optimizely-Managed Agents

These agents are built and maintained by Optimizely, tested for quality, and continuously improved.

3/31/26, 8:41 PM

Articles in this section

Optimizely-managed agents overview
Updated 3 hours ago

Follow

Optimizely-managed agents are powerful, pre-built tools that enhance your experience
and streamline common tasks in Optimizely, such as content creation, experimentation,
and analytics. Optimizely automatically installs and keeps these agents up to date, giving
you access to the latest features and improvements without manual intervention.
Optimizely integrates these agents directly into the product, making your workflows
more efficient and impactful.
Optimizely-managed agents have the following key characteristics:
Auto-installed – Optimizely automatically makes them available in your Optimizely
instance, requiring no manual configuration.
Auto-updated – Optimizely manages all updates so these agents run the latest
versions with the newest improvements and bug fixes.
Managed by Optimizely – Optimizely handles the underlying logic, tools, and
configurations so you can focus on using them effectively.
Integrated features – Optimizely designs them to enhance specific product
workflows and provide immediate value and efficiency.
Optimizely consistently updates Optimizely-managed agents. To maintain their integrity,
Optimizely locks certain fields that you cannot directly edit. To tailor an Optimizelymanaged agent to your specific requirements, create a copy. You can fully customize the
copied agent and modify any field to suit your needs. Creating a copy gives you full
control over its configuration, so your customizations remain stable and unaffected by
future automatic updates to the original Optimizely-managed agent.
While Optimizely-managed agents cover many common use cases, you might still want
to build a custom agent from scratch if your needs are highly specialized or require
unique integrations that the pre-built options do not address. Consider building custom
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/41942756023309-Optimizely-managed-agents-overview

1/3

3/31/26, 8:41 PM

agents for tasks that require entirely unique logic, tools, or data sources. See Create a
specialized agent.

Identify Optimizely-managed agents
To explore available Optimizely-managed agents, go to the Agent Directory in your
Optimizely instance. Optimizely-managed agents display a callout in their details that
identifies them. This visual indicator distinguishes them from other agents.

Optimizely-managed agents and workflows
When you add an Optimizely-managed agent to a workflow agent, a prompt asks

### All Available Agents

3/31/26, 8:41 PM

Articles in this section

Agents in the Agent Directory
Updated 1 month ago

Follow

Optimizely Opal works automatically to help you improve and streamline your workflows.
Agents enhance these core capabilities by handling specialized tasks like summarizing
content, generating marketing emails, and analyzing data.
These agents are available in every Opal instance. Click an agent's name to see what it
does, when to use it, and how to configure it for your needs. You cannot update the ID of
agents in the Agent Directory.
See Optimizely Academy's videos on Meet the Agents to learn more about the agents.
Note
Opal Administrators, Agent Builders, and users with the Add, edit, and install
specialized agents attribute for a custom role can add agents to their
organization's Optimizely Opal instance. See Add users and set permissions.

Strategy and planning
Competitive Insights – @competitive_insights
Description – Provides a complex and thorough review of competitive intelligence
and market research on competitors, focusing on data from the past seven days.
Challenge – Gaining deep, timely competitive intelligence and identifying actionable
next steps from vast amounts of data is overwhelming and resource-intensive.
Value – Timely insights, proactive strategy, competitive edge.
Competitive Webpage Analysis – @competitive_webpage_analysis
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39295834770957-Agents-in-the-Agent-Directory

1/9

3/31/26, 8:41 PM

Description – Scans your competitors' websites, captures screenshots, and delivers
an actionable report with recommended changes to outperform competitors so you
can easily see what is working in your market and how to stay ahead.
Challenge – You need to understand what your competitors are doing, identify
effective strategies in the market, and find ways to stay ahead.
Value – You can easily see what is working in your market and get clear guidance on
how to outperform your competitors.

LinkedIn InMail Copy Generation – @linkedin_inmail_generation
Description – Crafts engaging headlines, body text, and calls-to-action that align with
LinkedIn's professional audience and ad specifications, optimizing for B2B outreach.
Challenge – Manually crafting engaging and compliant LinkedIn InMail copy for B2B
outreach can be time-consuming and difficult.
Value – Streamlines the content creation process, saving time and resources.
Product Promotion – @product_promotion
Description – Builds and configures product promotions, seamlessly handling the
assignment of products and variants and the application of specific promotion types.
Challenge – Commerce teams face manual configuration, slow campaign launches,
and a lengthy promotional lifecycle.
Value – Launch targeted campaigns faster, reduces manual configuration, and
accelerates the entire promotional lifecycle from idea to execution.

Content creation
Blog Post Generation – @blog_generation
Description – Helps accelerate the creation of high-quality blog content.
Challenge – Creating high-quality blog content, including headlines, introductions,

### Content Creation Agents

Agents focused on creating marketing and content assets.

3/31/26, 8:42 PM

Categories

/ Content creation agents

Content creation agents
Agents tailored to accelerate and optimize your digital asset creation process.
These agents empower you to generate compelling digital assets, manage
them efficiently, and maintain brand consistency across all your channels.
Follow

Blog Post Generation agent
Campaign Brief Generation agent
Content Adaption agent
Content Ideation agent
Content Model Creation agent
Content Refresh Analysis agent
Content Summary agent
Content Translation agent
Creative Brief Generation agent
Email creation agent
Email Content Translation agent
Email Optimization agent
FAQ Creation agent
Privacy - Terms

https://support.optimizely.com/hc/en-us/sections/43451455101453-Content-creation-agents

1/2

3/31/26, 8:42 PM

Press Release agent
QR Code Generation agent
Quote Extraction agent
Social Post Generation agent
Social Post Research agent
Subject & Preview Text Ideation agent
UTM Creation agent
Webinar Follow-up Email Creation agent

Still have questions?
Contact us

Optimizely Website
Support Policy
Privacy Notice
Website terms of use
Cookie settings
Trust center
Third-Party Addons & Platforms
English (United States)

https://support.optimizely.com/hc/en-us/sections/43451455101453-Content-creation-agents

2/2



### Website Optimization Agents

Agents that optimize website performance, UX, and conversions.

3/31/26, 8:43 PM

Categories

/ Website optimization agents

Website optimization agents
Agents focused on enhancing your website's performance, user experience,
and conversion rates. These agents provide data-driven insights and tools to
optimize your digital properties through continuous experimentation and
personalization.
Follow

E-E-A-T Checker agent
GA4 Web Traffic Report Generation agent
GEO Auditor agent
GEO Recommendations agent
GEO Schema Optimization agent
Keyword Research agent
Profound Citation Gap Analysis agent
SEO Metadata Implementation agent
SEO Metadata Optimization agent
Technical SEO Auditor agent
Web Accessibility Evaluation agent

Privacy - Terms

https://support.optimizely.com/hc/en-us/sections/43451512771597-Website-optimization-agents

1/2

3/31/26, 8:43 PM

Still have questions?
Contact us

Optimizely Website
Support Policy
Privacy Notice
Website terms of use
Cookie settings
Trust center
Third-Party Addons & Platforms
English (United States)

https://support.optimizely.com/hc/en-us/sections/43451512771597-Website-optimization-agents

2/2



### End-to-End Testing Agents

Agents that create and execute test scenarios.

3/31/26, 8:42 PM

Categories

/ End to end testing agents

End to end testing agents
Agents designed for comprehensive end-to-end testing of your digital
experiences. These agents help validate functionality, performance, and user
journeys across your platforms, ensuring seamless and high-quality
deployments.
Follow

Experiment Planning agent
Experimentation Program Overview agent
Heatmap Analysis agent
Real-Time Audience Inspection agent

Still have questions?
Contact us

Privacy - Terms

https://support.optimizely.com/hc/en-us/sections/43451560621197-End-to-end-testing-agents

1/2

3/31/26, 8:42 PM

Optimizely Website
Support Policy
Privacy Notice
Website terms of use
Cookie settings
Trust center
Third-Party Addons & Platforms
English (United States)

https://support.optimizely.com/hc/en-us/sections/43451560621197-End-to-end-testing-agents

2/2



### Strategy & Planning Agents

#### Competitive Insights Agent

Analyzes competitive landscape and market positioning.

3/31/26, 8:41 PM

Articles in this section

/ Strategy and planning agents

Competitive Insights agent
Updated 28 days ago

Follow

Optimizely Opal's Competitive Insights agent provides a thorough review of competitive
intelligence and market research on competitors, focusing on data from the past 30 days.
It helps you stay informed about market shifts, identify emerging threats, and uncover
strategic opportunities. The agent creates a comprehensive competitive intelligence
report with actionable next-best actions for your consideration for a competitive edge.
Challenge – Conducting thorough competitive analysis for specific marketing use
cases is a complex and time-consuming task.
Agent outcome – Provides a comprehensive competitive analysis for marketing use
cases.
Value – Informed strategy, targeted campaigns.
See Competitive Insights Agent in Optimizely Academy for more information.

Required Optimizely products
None

Install agent
Note
Opal Administrators, Agent Builders, and users with the Add, edit, and install
specialized agents attribute for a custom role can add agents to their
organization's Optimizely Opal instance. See Add users and set permissions.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39360824748173-Competitive-Insights-agent

1/3

3/31/26, 8:41 PM

In Opal,

1. Go to Agents > Agent Directory.
2. Select Competitive Insights.
3. Click Install Agent to add it to your Opal instance.

Use
In Opal Chat, enter @competitive_insights and provide the following details:
Competitor – A competitor name or URL to research. For example, "Acme Corp" or

#### Competitive Webpage Analysis Agent

Analyzes competitor websites and digital strategies.

3/31/26, 8:42 PM

Articles in this section

/ Strategy and planning agents

Competitive Webpage Analysis agent
Updated 1 month ago

Follow

Optimizely Opal's Competitive Webpage Analysis agent scans your competitors'
websites, captures screenshots, and delivers an actionable report with recommended
changes to outperform competitors so you can easily see what is working in your market
and how to stay ahead.
Challenge – You need to understand what your competitors are doing, identify
effective strategies in the market, and find ways to stay ahead.
Agent outcome – The agent provides an actionable report, including screenshots of
competitor websites and recommended changes to improve my webpage's
performance.
Value – You can easily see what is working in your market and get clear guidance on
how to outperform your competitors.

Required Optimizely products
Web Experimentation or Feature Experimentation

Install agent
Note
Opal Administrators, Agent Builders, and users with the Add, edit, and install
specialized agents attribute for a custom role can add agents to their
organization's Optimizely Opal instance. See Add users and set permissions.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43515179864589-Competitive-Webpage-Analysis-agent

1/4

3/31/26, 8:42 PM

Do the following in Opal:

1. Go to Agents > Agent Directory.
2. Select Competitive Webpage Analysis.
3. Click Install Agent to add it to your Opal instance.

Note
If Install Agent is disabled, ensure you have the Required Optimizely products
connected to your Opal instance.

#### LinkedIn InMail Copy Generation Agent

Generates personalized LinkedIn InMail messages.

3/31/26, 8:42 PM

Articles in this section

/ Strategy and planning agents

LinkedIn InMail Copy Generation agent
Updated 1 month ago

Follow

Optimizely Opal's LinkedIn InMail Copy Generation agent crafts engaging headlines,
body text, and calls-to-action that align with LinkedIn's professional audience and ad
specifications, optimizing for B2B outreach.
Challenge – Manually crafting engaging and compliant LinkedIn InMail copy for B2B
outreach can be time-consuming and difficult. It requires expertise in copywriting,
understanding LinkedIn's professional audience, and adhering to ad specifications to
optimize for effective B2B communication.
Agent outcome – The agent generates optimized headlines, body text, and calls-toaction specifically designed for LinkedIn InMail. This content is aligned with LinkedIn's
professional audience and ad specifications, and it is tailored for B2B outreach.
Value – The LinkedIn InMail agent streamlines the content creation process, saving
time and resources. It helps ensure that InMail messages are engaging, compliant, and
effective for B2B outreach, potentially leading to improved response rates and
campaign performance on LinkedIn.

Required Optimizely products
None

Install agent
Note
Opal Administrators, Agent Builders, and users with the Add, edit, and install
specialized agents attribute for a custom role can add agents to their
https://support.optimizely.com/hc/en-us/articles/41095715603341-LinkedIn-InMail-Copy-Generation-agent

Privacy - Terms

1/4

3/31/26, 8:42 PM

organization's Optimizely Opal instance. See Add users and set permissions.

#### Product Promotion Agent

Creates product promotion copy and campaigns.

3/31/26, 8:42 PM

Articles in this section

/ Strategy and planning agents

Product Promotion agent
Updated 1 month ago

Follow

Optimizely Opal's Product Promotion agent builds and configures product promotions,
seamlessly handling the assignment of products and variants and the application of
specific promotion types. This lets you launch targeted campaigns faster, reduce manual
configuration, and accelerate the entire promotional lifecycle from idea to execution.
Challenge – Commerce teams face manual configuration, slow campaign launches,
and a lengthy promotional lifecycle.
Agent outcome – Builds and configures product promotions, seamlessly handling the
assignment of products and variants and the application of specific promotion types.
Value – Launch targeted campaigns faster, reduces manual configuration, and
accelerates the entire promotional lifecycle from idea to execution.

Required Optimizely products
Commerce Connect

Install agent
Note
Opal Administrators, Agent Builders, and users with the Add, edit, and install
specialized agents attribute for a custom role can add agents to their
organization's Optimizely Opal instance. See Add users and set permissions.
In Opal,
https://support.optimizely.com/hc/en-us/articles/42860322659085-Product-Promotion-agent

Privacy - Terms

1/4

3/31/26, 8:42 PM

1. Go to Agents > Agent Directory.
2. Select Product Promotion.
3. Click Install Agent to add it to your instance.

4. Complete the steps in the Get started with Opal tools to install and configure Opal in
your Commerce Connect instance if you have not done so before.

---

## Specialized Agents Development

### What are Specialized Agents?

Specialized Agents are custom AI agents you build to perform specific organizational tasks. Unlike pre-built agents, they are tailored to your exact requirements with custom prompts, tool access, and behavior.

**Key Characteristics:**
- Custom prompt instructions
- Controlled tool access
- Version tracking
- Performance monitoring via logs
- Iterative refinement
- Organization-specific knowledge

3/31/26, 8:34 PM

Articles in this section

Specialized agents overview
Updated 13 days ago

Follow

Specialized agents in Optimizely Opal are purpose-built AI agents you create that
complete a single, well-defined task. They operate in a single-shot model. You provide
inputs, the agent runs once, and it returns a result. There is no multi-turn conversation.
Each agent can use targeted tools, adjustable reasoning, and defined inputs to finish its
task accurately and efficiently.
See Create specialized agents to get started.
Note
Specialized agents have an automatic timeout of 60 minutes. Ensure that your
agent can complete within this timeframe, otherwise you may receive errors.
For a visual walkthrough of specialized agents, watch the video overview.

When to use specialized agents
Use specialized agents when you need to
Ensure consistent outcomes – Follow predefined logic and configurations to reduce
variability and produce reliable, repeatable results.
Control context – Define inputs, tools, and instructions to clarify what the agent can
access and how it behaves.
Maintain modularity in larger workflows – Reuse agents as components within
workflow agents to make multi-step processes easier to manage, debug, and evolve.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39109877359501-Specialized-agents-overview

1/9

3/31/26, 8:34 PM

Support single-shot execution – Complete tasks that do not require ongoing context
or follow-up; agents do not incorporate new information after execution.
Accelerate iteration and debugging – Test, tune, and debug single-purpose, stateless
agents independently for faster iteration and more stable systems.
Optimize at a fine-grained level – Experiment with inference settings or prompt
variants per agent without affecting the rest of a workflow.

Real-world scenarios
Specialized agents are effective for highly specific tasks. In the following scenarios, Opal
executes precise actions based on each agent’s configuration.

SEO keyword research
Marketing and content teams often struggle to conduct comprehensive SEO keyword
research, integrate insights into planning in the Optimizely Content Marketing Platform
(CMP), and ensure content is optimized for search visibility and performance. This can
lead to fragmented workflows, missed opportunities for organic traffic, and less datadriven decision-making.
How specialized agents in Opal help – A keyword research agent can take a topic and
return relevant keywords to target, using data from Optimizely Idea Lab and Google
Search.

### Fundamentals and Best Practices

#### Core Principles

1. **Clarity**: Write specific, unambiguous prompts
2. **Specificity**: Define exact task scope and outputs
3. **Iteration**: Test, measure, refine
4. **Versioning**: Track all changes
5. **Monitoring**: Review logs regularly
6. **Tool Access**: Grant only needed tools
7. **Knowledge**: Provide context and examples

3/31/26, 8:34 PM

Articles in this section

Specialized agents fundamentals and best
practices
Updated 11 days ago

Follow

Specialized agents in Optimizely Opal are purpose-built AI agents you create that
complete a single, well-defined task. They operate in a single-shot model. You provide
inputs, the agent runs once, and it returns a result. There is no multi-turn conversation.
Each agent can use targeted tools, adjustable reasoning, and defined inputs to finish its
task accurately and efficiently.
If you want to follow a step-by-step walkthrough to create an example specialized agent
that reviews website content against established financial promotion regulations
guidelines, see Create an example specialized agent walkthrough.

AI strategy, agent scope, and plan
Before creating a specialized agent in Optimizely Opal, you should understand how AI fits
into your wider organization, plan what kind of specialized agent you want to create,
comprehend the steps needed to create a specialized agent, and design a plan to create
your specialized agent.

Identify high-impact use cases
When developing a portfolio of high-impact use cases, it is essential to gather input from
multiple organizational perspectives. This includes top-down strategic direction from
leadership and bottom-up practical insights from practitioners executing businesscritical tasks. You can use a Creative Matrix framework to create an effective approach to
collaboration.
Structure the matrix with AI capabilities along one axis and business-relevant categories
along the other, such as strategic objectives, departmental functions, or major initiatives.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/42139997354509-Specialized-agents-fundamentals-and-best-practices

1/12

3/31/26, 8:34 PM

The following image is an example of a Creative Matrix:

Specialized agent scope
While it may be tempting to design multi-functional specialized agents that execute
complex sequential processes, best practice for initial development is to decompose
tasks into discrete, manageable components. Each component represents an individual
specialized agent that can subsequently be orchestrated into larger workflows to fulfill
more complex operational roles. See Workflow agents overview for information on linking
multiple agents together to create a workflow agent.
Note
If the specialized agent's function can be described with a single verb (for
instance, "Summarize", "Scan", or "Translate"), it is likely appropriately scoped.

Specialized agent plan
Define the operational strategy your specialized agent executes. When creating your
plan, consider the following questions:
https://support.optimizely.com/hc/en-us/articles/42139997354509-Specialized-agents-fundamentals-and-best-practices

2/12

3/31/26, 8:34 PM

Data sources
What external systems or platforms will the specialized agent need to access for
information (for example, public websites, internal databases, third-party APIs)?
What specific types of data will the agent retrieve (for instance, text content,

### Creating a Specialized Agent

#### Step-by-Step Process

3/31/26, 8:34 PM

Articles in this section

Create a specialized agent
Updated 13 days ago

Follow

Optimizely Opal administrators can create specialized agents using Opal. Specialized
agents are purpose-built AI agents you create that complete a single, well-defined task.
See Specialized agents overview for information.

Access your agents
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

4. Click Agents.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39333562134413-Create-a-specialized-agent

1/16

3/31/26, 8:34 PM

5. Select the Your Agents tab.

Create a specialized agent from scratch
Initial configuration
1. Follow the steps in the Access your agents section.
2. Click Add Agent and select Specialized Agent.

3. Enter a Name.
https://support.optimizely.com/hc/en-us/articles/39333562134413-Create-a-specialized-agent

2/16

3/31/26, 8:34 PM

4. Enter a unique Id. The Id (prefixed with @) invokes the specialized agent. Users in
Opal Chat or within a workflow agent invoke the specialized agent using the Id.
Ensure the Id is unique and displays as Available. If the Id is already in use, Opal
suggests a few available options instead. Click on a suggestion to auto-fill the Id field.

5. Add a Description. The description explains what the specialized agent is designed to
do and when collaborators should use it. This helps others understand the specialized
agent's purpose at a glance.
6. (Optional) Toggle Enabled in Chat on or off. Default is On.
On means the agent displays and users can call it in Opal Chat.
Off means the agent does not display nor can users call it in Opal Chat. The agent
is still available to be added to a workflow agent.

Configure the prompt template
Note
See Prompt template examples for tips and tricks and examples of prompt
templates.
Enter your Prompt Template. The prompt template defines how the specialized agent
behaves and responds. When entering your Prompt Template in the WYSIWYG editor,
keep the following in mind:
Write in clear, direct language.
Build a clear information hierarchy to help the specialized agent follow your
instructions accurately.
Use proper structure (headers, bold, and lists) to outline information.
https://support.optimizely.com/hc/en-us/articles/39333562134413-Create-a-specialized-agent

3/16

3/31/26, 8:34 PM

Double click on text to bring up the text editor.

Drag and drop text items to rearrange your prompt.

https://support.optimizely.com/hc/en-us/articles/39333562134413-Create-a-specialized-agent

4/16

3/31/26, 8:34 PM

See Prompt template examples.

Additional prompt template configuration
You can add additional information to your prompt template to help Opal create output.
1. (Optional) Specify input variables in double square brackets, such as
[[WEBSITE_URL]] or [[COMPANY_NAME]] .
Variables are input parameters that the specialized agent references each time it
runs.
Each variable must be defined in the Variables section. See Define input variables
You can add variables by entering / or [ in the prompt template and selecting
variables already defined in the Variables section or click Create variable to create

### Example Walkthrough

A detailed example showing the complete process of creating, configuring, and deploying a specialized agent.

3/31/26, 8:34 PM

Articles in this section

Create an example specialized agent
walkthrough
Updated 13 days ago

Follow

Specialized agents in Optimizely Opal are purpose-built AI agents you create that
complete a single, well-defined task. They operate in a single-shot model. You provide
inputs, the agent runs once, and it returns a result. There is no multi-turn conversation.
Each agent can use targeted tools, adjustable reasoning, and defined inputs to finish its
task accurately and efficiently.
This document walks you through creating an example specialized agent.

Prerequisites
Before developing your specialized agent, ensure the following:
You read and understand the content in the Specialized agents fundamentals and
best practices documentation.
Ensure you have Opal administrator access credentials.
Ensure Opal is integrated with the relevant Optimizely applications and products
required for your use case. See Optimizely Opal and AI features to confirm if Opal has
been integrated.

Real-world example
Content Review agent
Objective: Create a specialized agent that reviews website content against established
guidelines and reference materials. In this scenario, the reference material consists of
financial promotion regulations PDF created by Opal. The specialized agent generates a
report highlighting content requiring review, with visual indicators explaining non-

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/42014562882189-Create-an-example-specialized-agent-walkthrough

1/10

3/31/26, 8:34 PM

compliance with the example guidelines. The report is sent through email to the current
user when triggered manually in Opal Chat.

Build a specialized agent
The development process for the example Content Review Agent follows the following
workflow: Create → Configure → Build → Test → Refine → Deploy.

Create your specialized agent
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

4. Click Agents.

5. Select the Your Agents tab.

https://support.optimizely.com/hc/en-us/articles/42014562882189-Create-an-example-specialized-agent-walkthrough

2/10

3/31/26, 8:34 PM

6. Click Add Agent > Specialized agent to create a new specialized agent.

Configure your specialized agent
Details section
You begin crafting your specialized agent in the Details section. This section contains
basic information about your specialized agent. See the Details section in the Specialized
agents fundamentals and best practices documentation for details.
1. Enter the following information:
Name – Content Review agent
Id – content-review-agent
Description – Reviews content from a URL for compliance with a set of guidelines
and recommended changes with justification as to why the content is noncompliant. The reference guidelines could be brand guidelines, or any other kind
of guidelines, but in this case, there is a set of financial promotion guidelines
created by Opal.
2. Leave the Active on.
3. Toggle the Enabled in Chat option off. Your specialized agent should appear similar to
the following:

https://support.optimizely.com/hc/en-us/articles/42014562882189-Create-an-example-specialized-agent-walkthrough

### Prompt Template Examples

#### Template Structure

Effective agent prompts follow this structure:

```
[Role Definition]
[Task Specification]
[Instructions and Constraints]
[Output Format]
[Tool Usage Guidelines]
[Example Inputs/Outputs]
```

#### Examples

3/31/26, 8:34 PM

Articles in this section

Prompt template examples
Updated 14 days ago

Follow

The prompt template defines how a specialized agent behaves and responds. A clear and
well-structured prompt template helps Optimizely Opal execute tasks accurately and
consistently. When writing your prompt template, keep the following in mind:
Write in clear, direct language.
Build a clear information hierarchy to help the specialized agent follow your
instructions accurately.
Use accurate formatting elements (headers, bold, and lists) to structure information.
Double click on text to bring up the text editor.
Drag and drop text items to rearrange your prompt.

Optional components for prompt templates
To further refine how your specialized agent processes information and generates
responses, you can optionally incorporate various components directly into your prompt
template. These additions provide the specialized agent with specific context, define
available tools, integrate external data, and offer examples to guide its behavior, leading
to more accurate and predictable outcomes.

Input variables
Specify input variables using double square brackets, for example, [[WEBSITE_URL]] or
[[COMPANY_NAME]] . Add variables by clicking + or pressing / in the editor.
Variables are input parameters that the agent references each time it runs.
Each variable must also be defined in the Variables section of the specialized agent.

Tools
https://support.optimizely.com/hc/en-us/articles/39300056376717-Prompt-template-examples

Privacy - Terms

1/5

3/31/26, 8:34 PM

Specify which tools the specialized agent should implement by using backticks, for
example, `TOOL_NAME` or `BROWSE_WEB` .
Tools extend what Opal can do, such as executing actions or pulling information from
other services.
You can define when and how to use the tool directly in the prompt for more
controlled and predictable results.
Each tool must be added in the Tools section of the specialized agent.
(Optional) Specify instructions using curly braces, for example: {instruction:
description of which instructions to use} or {instruction: use all
instructions related to content creation} .
Instructions are reusable context and guidelines that shape Opal's responses.
Specialized agents do not automatically reference instructions. You must explicitly
include them in the prompt template.

RAG
Reference data through Retrieval-Augmented Generation (RAG). For a list of available
RAG sources, see Retrieval-Augmented Generation (RAG) overview.
Important
Optimizely Opal RAG is available upon request. Contact your Customer
Success Manager for information.
To include data from a connected RAG system in your specialized agent, complete one of
the following:
Inject the data and context directly into the prompt template.
{retrieval: query of data to retrieve} – Returns text information from
RAG.
{retrieval+: query of data to retrieve} – Returns text and file information
from RAG.
Retrieve the data through a tool call. See RAG tools for information.
Add the search_application_data tool to the agent. See the Define tools

### Testing Specialized Agents

#### Test Strategy

1. **Unit Testing**: Test individual components
2. **Integration Testing**: Test with real tools
3. **User Testing**: Validate with target users
4. **Regression Testing**: Ensure changes don't break existing behavior

3/31/26, 8:34 PM

Articles in this section

Test a specialized agent
Updated 1 month ago

Follow

You can test your specialized agent in Optimizely Opal before deploying it or after editing
it.

Access your agents
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

4. Click Agents.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43420488102157-Test-a-specialized-agent

1/6

3/31/26, 8:34 PM

5. Select the Your Agents tab.

Test your specialized agent
To complete a Test Run of your specialized agent, complete the following steps:
1. Follow the steps in the Access your agents section.
2. Click the agent name or click More actions (...) > Edit Agent.
3. Click Test Run.

https://support.optimizely.com/hc/en-us/articles/43420488102157-Test-a-specialized-agent

2/6

3/31/26, 8:34 PM

4. (Optional) Enter values for any specified input variables for your agent.
(Optional) Click Clear All to remove all parameters.
5. Click Run.
The agent runs and displays the Execution Results. Click Stop Execution to end the Test
Run.
The Execution Results include the following information:
Output – The agent's execution results.
Execution ID – The unique identifier of the request.
Status – Whether the run was successful.
Output – The final result returned to Opal Chat or a workflow agent.
Memory – Each step that Opal takes while executing the agent. Use this information
to debug your agent and confirm that the outputs and steps make sense.
The first message shows the initial request, including the prompt template and
variable values.
The last message is the final output returned to the user.
Other messages in between are steps that Opal takes to form its response,
including tool calls in JSON format and repeated actions until Opal comes to a
satisfactory output.
The following is a truncated example of an agent's execution:

https://support.optimizely.com/hc/en-us/articles/43420488102157-Test-a-specialized-agent

3/6

3/31/26, 8:34 PM

https://support.optimizely.com/hc/en-us/articles/43420488102157-Test-a-specialized-agent

### Versioning Strategy

Opal automatically versions your agents, tracking changes and enabling rollback.

3/31/26, 8:35 PM

Articles in this section

Specialized agent versions
Updated 28 days ago

Follow

You can view the version history of specialized agents in Optimizely Opal, letting you
view any changes and debug issues that arise.

Access your agents
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

4. Click Agents.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43420682424077-Specialized-agent-versions

1/8

3/31/26, 8:35 PM

5. Select the Your Agents tab.

View specialized agent history
You can view a specialized agent's history, which includes previous versions, their
modification dates and times, and the individuals responsible for those updates.
To view a specialized agent's history, complete the following:
1. Follow the steps in the Access your agents section.
2. Click the specialized agent name or click More (...) > Edit Agent.
3. Click View version history.

https://support.optimizely.com/hc/en-us/articles/43420682424077-Specialized-agent-versions

2/8

3/31/26, 8:35 PM

View previous version of a specialized agent
You can view a previous version of a specialized agent using the Version History. To do
so, complete the steps in the View version history section and then click on a previous
version of the specialized agent.

Or click More (...) > View this version on the previous version you want view.

https://support.optimizely.com/hc/en-us/articles/43420682424077-Specialized-agent-versions

3/8

3/31/26, 8:35 PM

Restore a specialized agent to a previous version
Version control for specialized agents acts as a safety, letting you recover from
unforeseen problems, and supports iterative development and deployment with
reduced-risk development and deployment. Restoring a version of a specialized agent
replaces your current agent configuration and creates a new version.
You might need to restore an agent to a previous version for the following reasons:
Introduction of bugs or errors – New versions, despite rigorous testing, can
sometimes introduce unexpected bugs or break existing functionalities. Restoring to a

### Monitoring and Logs

Access logs to understand agent behavior and identify improvement areas.

3/31/26, 8:35 PM

Articles in this section

Specialized agent logs
Updated 8 days ago

Follow

You can view and download a log of a specialized agent's execution in Optimizely Opal.
Use the logs to help you debug the agent and see how your agent is performing.

Access your agents
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

4. Click Agents.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43420950339725-Specialized-agent-logs

1/9

3/31/26, 8:35 PM

5. Select the Your Agents tab.

View specialized agent logs
To access the Logs of a specialized agent, complete the following steps:
1. Follow the steps in the Access your agents section.
2. Click the agent for which you want to view its logs or click More (...) > Edit Agent.
3. Select the Logs tab.

https://support.optimizely.com/hc/en-us/articles/43420950339725-Specialized-agent-logs

2/9

3/31/26, 8:35 PM

4. Click an execution to view its logs.

Specialized agent logs overview
Started
The specialized agent logs for executions still running display information like the
following:

1. Status – Displays Started as the agent is running.
2. Stop Execution – Click to stop the agent.
3. Close – Close the execution details.
https://support.optimizely.com/hc/en-us/articles/43420950339725-Specialized-agent-logs

3/9

3/31/26, 8:35 PM

4. Version information – The version number and timestamp of when the agent was
started.
5. Agent Name – The name of the agent invoked. Click Copy to copy the name to your
clipboard.
6. Execution ID – The unique ID of the agent's execution. Use this ID to identify a
specific agent run. Click Copy to copy the ID to your clipboard. See the Access a
specialized agent's execution ID section for information.
7. Execution Time – The timestamp of when the agent was started.
8. Triggered By – The name of the user who started the agent.
9. Input Variables – The variables that were used in the execution. Click Copy to copy
the variables to your clipboard to easily reference and debug agent runs.
10. Output – The agent response from Opal including any error messages. The output

### Managing Specialized Agents

3/31/26, 8:34 PM

Articles in this section

Manage specialized agents
Updated 13 days ago

Follow

Agents in Optimizely Opal are purpose-built AI agents that complete specific, welldefined tasks. They operate in a single-shot model. You provide inputs, the agent runs
once, and it returns a result.
In Opal, Opal Administrators and Agent Builders can create, customize, and manage
agents using prompts, input variables, and tools to automate tasks accurately and
efficiently.

Access your agents
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

4. Click Agents.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43420242726925-Manage-specialized-agents

1/7

3/31/26, 8:34 PM

5. Select the Your Agents tab.

Create a specialized agent
See Create specialized agents.

Use a specialized agent
You can use specialized agents in the following ways:
Opal Chat – Invoke a specialized agent by calling its @Id in Opal Chat.
Workflow agent – Run the agent as part of a workflow.

Edit a specialized agent
1. Follow the steps in the Access your agents section.
2. Click the agent name or click More actions (...) > Edit Agent.
3. Make changes to the agent's configuration, such as its prompt, variables, or tools.
4. (Optional) Click Test Run to verify your changes. See the Test a specialized agent
documentation for information.
5. Click Update.
https://support.optimizely.com/hc/en-us/articles/43420242726925-Manage-specialized-agents

2/7

3/31/26, 8:34 PM

Delete a specialized agent
Important

Deleting an agent is permanent and cannot be undone.

Delete from the Agents page
1. Follow the steps in the Access your agents section.
2. Click More actions (...) on the agent you want to delete.
3. Select Delete Agent.

4. Click Delete on the Delete Agent confirmation page.

Delete from the agent details
1. Follow the steps in the Access your agents section.
2. Click the agent name or click More actions (...) > Edit Agent.
3. Click More options (...).

https://support.optimizely.com/hc/en-us/articles/43420242726925-Manage-specialized-agents

---

## Workflow Agents Development

### What are Workflow Agents?

Workflow Agents automate complex, multi-step processes by orchestrating actions, conditions, loops, and error handling. They're ideal for:

- Approval processes and escalations
- Data transformation and migration
- Multi-system synchronization
- Scheduled automation
- Event-driven workflows
- Conditional branching logic

3/31/26, 8:29 PM

Articles in this section

Workflow agents overview
Updated 15 days ago

Follow

Optimizely Opal workflow agents let you automate and optimize complex business
processes by orchestrating triggers, logic, and agents. Workflow agents streamline multistep tasks, support autonomous agent behavior, and enable advanced logic, such as
looping and branching through conditional rules. Additionally, workflow agents are
designed to scale with your organizational needs and adapt to evolving processes.

Note
Workflow agents are in private GA and not available in all Opal instances.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39417564742797-Workflow-agents-overview

1/4

3/31/26, 8:29 PM

Structure

Workflow agents are built from the following three main sections and work together to
create a complete automation:
Triggers – Define the events or conditions that start the workflow agent.
Logic – Configure advanced logic, including loops and branching, using specific
conditions.
Agents – Add and arrange specialized agents to create a complete workflow.
Together, these sections determine when a workflow agent begins, how it progresses
through decision points, and which agents complete the process.

When to use workflow agents
Workflow agents are ideal for coordinating multiple steps and connecting different
agents into a single, automated execution. They are especially helpful when you need to
achieve measurable improvements in efficiency and accuracy.
Streamline multi-step processes – Automate complex workflows with multiple steps
and hand-offs to reduce delays, increase efficiency, and improve data consistency.
This can lead to faster time-to-market for campaigns and reduced operational costs.
Combine specialized agents – Let multiple specialized agents work together,
applying reasoning and intelligent hand-offs to automate difficult or repetitive tasks.
This reduces manual effort, minimizes errors, and frees up your team for more
strategic work.
If your goal is to improve collaboration, reduce manual effort, or better integrate your
marketing tools, a workflow agent can be a powerful solution.

Best practices for workflow agents
Building an effective workflow agent requires some considerations. Observe the
following best practices to keep workflow agents efficient and manageable:
Design modular agents – Keep specialized agents small and focused. Each agent
should handle a single task or decision point. This modular approach makes complex
workflow agents easier to manage and debug.
Use workflow logic for complex processes – Avoid adding too much logic inside a

### Creating a Workflow Agent

#### Architecture Components

A workflow agent consists of:

- **Trigger**: What starts the workflow
- **Steps**: Sequential actions or decision points
- **Conditions**: Logic branches
- **Loops**: Iteration over data
- **Error Handling**: Failure recovery
- **Outputs**: Results and logging

3/31/26, 8:30 PM

Articles in this section

Create a workflow agent
Updated 11 days ago

Follow

You can create workflow agents in Optimizely Opal. Workflow agents stitch together
multiple agents into a complex workflow. They can automate and streamline multi-step
processes within the Optimizely platform.

Access your agents
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

4. Click Agents.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/39799078278285-Create-a-workflow-agent

1/10

3/31/26, 8:30 PM

5. Select the Your Agents tab.

Create a workflow agent from scratch
1. Follow the steps in the Access your agents section.
2. Click Add Agent > Workflow Agent.

3. Enter a Name.
4. (Optional) Toggle Active on or off.
On means the workflow agent can be executed.
Off means the workflow agent cannot be executed. This is helpful while you are
still developing the agent.
5. Enter a unique Id. Ensure the Id is unique and displays as Available.
https://support.optimizely.com/hc/en-us/articles/39799078278285-Create-a-workflow-agent

2/10

3/31/26, 8:30 PM

6. Add a Description. The description explains what the workflow agent does and when
collaborators should use it. This helps others understand the workflow agent's
purpose.
7. Click Apply.

Configure your workflow agent
The workflow agent can be as simple or advanced as you want. The following example
shows how to connect a simple trigger and a specialized agent. A trigger refers to an
event or condition that initiates the workflow agent. See Workflow triggers for
information.
1. Drag and drop a Scheduler trigger into the workspace.
2. Edit the Scheduled Trigger to your specific needs. In the following example image,
the schedule runs at the beginning of every month. See Workflow agent triggers for
more information.

https://support.optimizely.com/hc/en-us/articles/39799078278285-Create-a-workflow-agent

3/10

3/31/26, 8:30 PM

3. Click Save.
4. Drag and drop a specialized agent from the Agents section into the workspace or
click Create new specialized agent. See Create a specialized agent from scratch.

https://support.optimizely.com/hc/en-us/articles/39799078278285-Create-a-workflow-agent

4/10

3/31/26, 8:30 PM

5. Connect the Trigger and Agent. To do so, click the Scheduler trigger's connector
circle.

https://support.optimizely.com/hc/en-us/articles/39799078278285-Create-a-workflow-agent

5/10

3/31/26, 8:30 PM

Drag the connector to the Agent.

6. Click Save.

Add logic to your workflow agent (optional)
Logic elements, such as Conditions and Loops, let you build dynamic and automated

### Workflow Triggers

Triggers define when a workflow starts.

#### Types of Triggers:
- **Scheduled**: Cron-based, time-based execution
- **Event-Based**: Webhook, system events, queue messages
- **Manual**: User-initiated execution
- **Integration**: External system triggers

3/31/26, 8:30 PM

Articles in this section

Workflow agent triggers
Updated 6 days ago

Follow

Workflow triggers start an Optimizely Opal workflow agent when their defined conditions
are met. Each trigger listens for a specific event, such as a chat command, a scheduled
time, a webhook call, or an email. When that event occurs, the workflow agent runs.

Trigger

Best for

Example

Chat
Input

On-demand runs from Opal
Chat.

Type

Scheduler

Time-based and recurring
tasks.

Nightly sync at 10:00 PM.

Webhook

Immediate reactions to external
events.

Trigger on incoming webhook or when a
build pipeline completes.

https://support.optimizely.com/hc/en-us/articles/39865892823693-Workflow-agent-triggers

@workflow generate weekly brief

kick off automation.

to

Privacy - Terms

1/15

3/31/26, 8:30 PM

Trigger
Email

Best for
Human approvals and
attachment-driven flows.

Example
Reviewer emails approval or sends a CSV
to process.

Important information about triggers
Connections

When configuring a trigger for your workflow agent, the trigger establishes a connection
to a specific associated Optimizely instance during its creation.

If you change the connection to an associated instance after a trigger is created, the
trigger may continue to reference the original instance it was configured with. This can
lead to unexpected behavior or issues where the workflow agent does not interact with
the intended instance.
To prevent this, ensure that your connections to all associated instances are established
before creating workflow triggers. If you must change a connection, recreate any
affected triggers to ensure they are correctly linked to the updated instance. See the
Connections section in the Get started with Optimizely Opal for administrators
documentation for information.

Creator
A workflow agent's actions display as performed by the user who created the trigger. For
example, if User1 creates a trigger and the workflow agent creates a page in Optimizely
Content Management System (SaaS), User1 displays as the page's creator.

Field importance for AI
https://support.optimizely.com/hc/en-us/articles/39865892823693-Workflow-agent-triggers

2/15

3/31/26, 8:30 PM

Descriptions and other configuration fields play an important role in how Opal processes
workflow agents. All description fields contribute to clarity, maintainability, and future
functionality. Required fields are meaningful either immediately or for upcoming platform
capabilities. Because of this, you should enter complete and accurate descriptions for all
fields, including those in specialized agents and tools.

### Workflow Conditions

Conditions provide branching logic within workflows.

#### Supported Conditions:
- Equality comparisons (==, !=)
- Numeric comparisons (<, >, <=, >=)
- String operations (contains, matches regex)
- Array operations (in, not in)
- Logical operators (AND, OR, NOT)
- Variable evaluation

3/31/26, 8:30 PM

Articles in this section

Workflow agent conditions
Updated 15 days ago

Follow

The Condition logic element in Optimizely Opal's workflow agent builder introduces
decision-making and branching paths into your workflows. It uses "if this, then that" logic
to evaluate a criterion, directing the workflow to different actions based on whether it
meets that criterion. Your workflow agents adapt dynamically to varying data, user inputs,
or system states, ensuring the correct process for every scenario.

When to use conditions
https://support.optimizely.com/hc/en-us/articles/43620929090829-Workflow-agent-conditions

Privacy - Terms

1/5

3/31/26, 8:30 PM

Conditions are essential when your workflow makes decisions and follows different paths
based on specific criteria. Consider using a Condition in the following situations:
Dynamic routing – Direct tasks or content to different teams, individuals, or stages
based on their attributes, such as content type, priority, or associated campaign.
Conditional execution – Perform an action only if certain prerequisites apply. For
example, send a notification if a deadline approaches, or publish content if you
approve it.
Data validation – Check if inputs or data points meet specific requirements before
letting the workflow proceed. For example, ensure a budget value is within an
acceptable range.

How to add a condition to a workflow
After following the steps to create a workflow agent from scratch and configure
workflow, optionally add conditions to your workflow.
1. Drag and drop a Condition from the Logic section into the workspace.
2. Drag and drop two agents from the Agents section into the workspace.
3. Connect the Condition to an Agent before and after it. Click the Condition and click a
connector circle. Drag the connector to the Agent.

4. Select a Match Type. Options include the following:
1. Equals – The output matches the condition value exactly.
2. Not Equals – The output does not match the condition value.
3. Contains – The output contains the condition value.
4. Not Contains – The output does not contain the condition value.
5. Greater Than – The output is greater than the condition value.
6. Less Than – The output is less than the condition value.
7. Greater Than or Equals – The output is greater than or equal to the condition
value.
8. Less Than or Equals – The output is less than or equal to the condition value.
9. Regex – The output matches a regular expression pattern.
https://support.optimizely.com/hc/en-us/articles/43620929090829-Workflow-agent-conditions

### Workflow Loops

Loops enable iteration over datasets and collections.

#### Loop Types:
- **For Loop**: Iterate fixed number of times
- **ForEach Loop**: Iterate over array items
- **While Loop**: Conditional iteration
- **Break/Continue**: Loop control statements

3/31/26, 8:30 PM

Articles in this section

Workflow agent loops
Updated 1 month ago

Follow

The Loop logic element in Optimizely Opal's workflow agent builder interface automates
repetitive tasks within your workflows. Specifically, it functions as a "For Each" loop,
iterating over a collection of items (such as URLs, keywords, or data sets) and executing a
defined set of actions for each item. This capability significantly streamlines complex
processes and lets you process multiple items without manual intervention.

You can add the following in a Loop:
Specialized agent steps – Run an agent on each item.
Conditional steps – Branch logic within each iteration.
Nested loops – Add loops within loops for multi-level iteration.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43590976293389-Workflow-agent-loops

1/4

3/31/26, 8:30 PM

When to use loops

Loops are ideal for scenarios where you perform the same operation on multiple pieces
of data. Consider using a loop in the following situations:
Iterating through data sets – Systematically go through a collection of data points,
performing a specific action for each one.
Processing lists of items – Apply the same action (for example, create content,
update status, or generate reports) to each item in a collection, such as a list of
assets, campaigns, keywords, variations, or segments.
Generating multiple variations – Create multiple versions of content or other outputs
based on different parameters from a list of inputs.

How to add a loop to a workflow
After you create a workflow agent from scratch and configure workflow, you can
optionally add loops to your workflow.
1. Drag and drop a Loop from the Logic section into the workspace.
2. (Optional) Rename your loop and add a Description.
3. Connect an agent that provides the collection of items to iterate on. Click
the Agent and click a connector circle. Drag the connector to the Loop.
4. Drag and drop an agent, condition, or another loop into the loop.

5. Click Save to update your workflow agent.

Best practices and considerations
Keep the following in mind when working with loops:
Nesting – Use up to three nested loops to create complex iterative processes.
Performance – Be mindful of the number of iterations. Very large loops impact the
workflow agent's execution time.
Variable scope – Understand how variables defined inside and outside the loop are
accessed and modified to ensure correct data flow.
https://support.optimizely.com/hc/en-us/articles/43590976293389-Workflow-agent-loops

2/4

3/31/26, 8:30 PM

### Testing Workflow Agents

#### Testing Approach

1. **Syntax Validation**: Check for errors
2. **Dry Runs**: Execute without side effects
3. **Variable Testing**: Verify data flow
4. **Edge Cases**: Test boundary conditions
5. **Integration Testing**: Test with real tools

3/31/26, 8:30 PM

Articles in this section

Test a workflow agent
Updated 8 days ago

Follow

After you create a workflow agent in Optimizely Opal, if you used Chat Input as the
trigger, you can test it before deploying it.
Note
You cannot test agents that have Scheduler, Webhook, or Email triggers.

Access your agents
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

4. Click Agents.
https://support.optimizely.com/hc/en-us/articles/43421492615565-Test-a-workflow-agent

Privacy - Terms

1/6

3/31/26, 8:30 PM

5. Select the Your Agents tab.

Test run
To complete a Test Run of your workflow agent, complete the following steps:
1. Follow the steps to Access your agents section.
2. Click on the workflow agent or click More (...) > Edit Agent.

https://support.optimizely.com/hc/en-us/articles/43421492615565-Test-a-workflow-agent

2/6

3/31/26, 8:30 PM

3. Click Test Run.

4. Enter a message that would trigger your workflow agent.
(Optional) Click Clear to reset the Trigger Text box.
5. Click Run Workflow.
6. (Optional) Click View Full Execution in the Test Run to open the Workflow
Execution.
(Optional) Click Clear to clear the Execution Results.

Workflow execution
The Workflow Execution displays the workflow agent's progress and status during
execution.

https://support.optimizely.com/hc/en-us/articles/43421492615565-Test-a-workflow-agent

3/6

3/31/26, 8:30 PM

Click Cancel Execution to stop Opal's current run of the workflow agent.

Click Resume Execution to restart Opal's run of the workflow agent.

Click an individual agent to view its details when it reaches Completed status.
https://support.optimizely.com/hc/en-us/articles/43421492615565-Test-a-workflow-agent

4/6

3/31/26, 8:30 PM

Note
If you use Opti ID, administrators can turn off generative AI in the Opti ID Admin
Center. See Turn generative AI off across Optimizely applications.

Previous article
Manage workflow agents

Next article
Workflow agent logs

Still have questions?
Contact us

Optimizely Website
Support Policy
Privacy Notice
Website terms of use
Cookie settings

### Monitoring and Logs

3/31/26, 8:30 PM

Articles in this section

Workflow agent logs
Updated 8 days ago

Follow

After your workflow agent runs, you can view a log of that execution in Optimizely Opal.
This helps you debug the agent and see how your agent is performing.

Access your agents
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

4. Click Agents.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43421534871949-Workflow-agent-logs

1/6

3/31/26, 8:30 PM

5. Select the Your Agents tab.

View the logs
You can view a workflow agent's logs using the following options.

From the Agents page
To access the logs of a workflow agent from the Agents page, complete the following:
1. Follow the steps in the Access your agents section.
2. Select the Workflow Logs tab.

https://support.optimizely.com/hc/en-us/articles/43421534871949-Workflow-agent-logs

2/6

3/31/26, 8:30 PM

3. Click on a workflow's execution to view its logs.

From the workflow editor
1. Follow the steps in the Access your agents section.
2. Click on the agent name or click More (...) > Edit Agent.
3. Click More (...) > View Logs.

4. Click on an execution to view its logs.

Workflow agent log overview
Started
The workflow agent's log that is still running displays similar to the following:

https://support.optimizely.com/hc/en-us/articles/43421534871949-Workflow-agent-logs

3/6

3/31/26, 8:30 PM

1. Details – Toggle the details panel of the execution on or off.
2. Name – The name of the workflow agent.
3. Timestamp – The timestamp of when the workflow agent started.
4. Status – Indicates the workflow agent is still running.
5. Cancel Execution – Stop the workflow agent.
6. Close details – Close the details panel of the execution.
7. Agent Name – The name of the workflow agent.
8. Execution ID – The unique ID of the workflow agent's execution. Use this ID to
identify a specific agent run.
9. Execution Time – The timestamp of when the workflow agent executed started.
10. Triggered By – The name of the person who ran the workflow agent. If the workflow
agent is started from a webhook, the user who created the workflow agent displays

### Execution ID Management

3/31/26, 8:30 PM

Articles in this section

Copy the execution ID of a workflow agent
Updated 15 days ago

Follow

The Execution ID is a unique identifier for a specific run of a workflow agent in
Optimizely Opal. You might need it for the following reasons:
Tracking and monitoring – It lets you track the progress and status of a long-running
agent execution.
Retrieving results – If an agent's execution is asynchronous or takes time, you can
use the Execution ID to retrieve the results once the agent has finished its work.
Debugging and auditing – In case of issues or unexpected outcomes, the Execution
ID helps in tracing back the specific run, reviewing logs, and understanding what
happened during that execution.
Referencing – It provides a concrete reference point when discussing a particular
agent run with support teams or collaborators.
To copy the execution ID of a workflow agent, complete the following:

Access your agents
First, access your agents.
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43421548243085-Copy-the-execution-ID-of-a-workflow-agent

1/5

3/31/26, 8:30 PM

4. Click Agents.

5. Select the Your Agents tab.

Access the workflow agent's execution
You can access a workflow agent's execution using the following options. See Workflow
agent logs for information.

From the workflow agent details page
https://support.optimizely.com/hc/en-us/articles/43421548243085-Copy-the-execution-ID-of-a-workflow-agent

2/5

3/31/26, 8:30 PM

### Managing Workflow Agents

3/31/26, 8:30 PM

Articles in this section

Manage workflow agents
Updated 15 days ago

Follow

Optimizely Opal workflow agents let you automate and optimize complex business
processes by orchestrating triggers, logic, and agents. Workflow agents streamline multistep tasks, support autonomous agent behavior, and enable advanced logic, such as
looping and branching through conditional rules. Additionally, workflow agents are
designed to scale with your organizational needs and adapt to evolving processes.

Access your agents
1. Go to home.optimizely.com
2. Select your organization.
3. Select Opal.

4. Click Agents.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43421467541645-Manage-workflow-agents

1/8

3/31/26, 8:30 PM

5. Select the Your Agents tab.

Create a workflow agent
See Create a workflow agent.

Use a workflow agent
Workflow agents are started by their trigger. See Workflow agent triggers.

Edit a workflow agent
1. Follow the steps in the Access your agents section.
2. Click the agent name or click More (...) > Edit Agent.

https://support.optimizely.com/hc/en-us/articles/43421467541645-Manage-workflow-agents

2/8

3/31/26, 8:30 PM

3. Make changes to the workflow agent's configuration in the Workflow Setup.
4. Click Apply.

Switch between the workflow builder and setup
To open the Workflow Setup page to update the workflow agent's Name, Id, or
Description, click More (...) > Setup.

https://support.optimizely.com/hc/en-us/articles/43421467541645-Manage-workflow-agents

3/8

3/31/26, 8:30 PM

To close the Workflow Setup page, click Close or More (...) > Setup.

https://support.optimizely.com/hc/en-us/articles/43421467541645-Manage-workflow-agents

4/8

3/31/26, 8:30 PM

Delete a workflow agent
Important
Deleting an agent is permanent and cannot be undone.

Delete from the Agents page
1. Follow the steps in the Access your agents section.
2. Click More (...) on the workflow agent you want to delete.
3. Select Delete Agent.

4. Click Delete on the Delete Agent confirmation page.

Delete from the agent details
1. Follow the steps in the Access your agents section.

---

## RAG (Retrieval-Augmented Generation)

### What is RAG?

Retrieval-Augmented Generation (RAG) enhances AI agents with access to knowledge bases, content repositories, and external data sources. Instead of relying solely on pre-trained knowledge, RAG enables agents to:

- Search and retrieve relevant documents
- Ground responses in specific content
- Reduce hallucinations
- Provide current, accurate information
- Reference source materials

3/31/26, 8:31 PM

Articles in this section

Retrieval-Augmented Generation (RAG)
overview
Updated 3 months ago

Follow

Retrieval-augmented generation (RAG) lets Optimizely Opal access, understand, and
query knowledge sources. By leveraging RAG, Opal can be informed by critical data such
as campaigns, content, tests, and more to provide more contextual, accurate, and
personalized responses.

Optimizely Opal RAG
Important
Optimizely Opal RAG is available upon request. Contact your Customer Success
Manager for information.
Opal RAG transforms discovery in Optimizely from manual searching into an intelligent,
permission-aware, multi-modal retrieval experience, embedded seamlessly in Opal.
Making Opal customized and context-aware of your business and organizational assets.
Unified content graph – Campaigns, tasks, assets, and permissions modeled as nodes
or edges.
Multi-modal retrieval – Vector + keyword search across text, PDFs, images, video,
and metadata.
Natural language queries – LLM translates user requests into optimized graph
queries.
Permission-aware access – Query-level filters + post-query verification against the
Permission Service.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/40191922084493-Retrieval-Augmented-Generation-RAG-overview

1/3

3/31/26, 8:31 PM

Intelligent responses – Summaries, lists, and recommendations refined through Opal
for contextual insights.

Why RAG matters
Organizations are rightfully cautious about AI. Without checks, AI can do the following:
Generate outdated or incorrect content.
Produce tone-deaf or off-brand messaging.
Violate compliance or privacy requirements.
RAG changes this dynamic by helping AI act more like your best employees: consulting
current documentation, campaigns, and customer data before responding. This is
particularly valuable in industries like financial services, healthcare, retail, and enterprise
marketing, where accuracy and personalization are critical.

How RAG works
1. Retrieval – The AI searches a vector database to find the most relevant information
across structured and unstructured sources.
2. Processing – The retrieved data is analyzed and contextualized for accuracy.
3. Generation – Using that context, the AI generates an accurate, brand-consistent
response.

Key use cases
Marketers – Show me all assets tagged with 'Holiday Promotion' used in live
campaigns.
Campaign managers – What tasks and approvals are pending for the Black Friday
campaign?
Developers – List all stale feature flags not updated in 90 days.

Data privacy and security

### RAG for Content Marketing Platform (CMP)

The CMP system tool includes built-in RAG capabilities for content search and retrieval.

3/31/26, 8:31 PM

Articles in this section

RAG for Content Marketing Platform (CMP)
Updated 1 month ago

Follow

Retrieval-augmented generation (RAG) lets Optimizely Opal access, understand, and
query knowledge sources. See Retrieval-Augmented Generation (RAG) overview for
information
Important
Optimizely Opal RAG is available upon request. Contact your Customer Success
Manager for information.

How RAG helps marketing teams
Create personalized content – Tailored messaging by customer segments.
Maintain brand voice – AI-generated outputs stay on-message.
Scale content creation – Automated blogs, emails, ads, social content.
Use approved messaging – Ensures compliance with brand and legal rules.

Example
A clothing retailer using RAG can complete the following:
Retrieve customer purchase history and approved product data.
Generate personalized recommendations.
Write a branded campaign email with new arrivals.
Results in higher engagement, conversions, and loyalty.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/40604966361997-RAG-for-Content-Marketing-Platform-CMP

1/5

3/31/26, 8:31 PM

Supported data

The following are details on what fields are currently supported and synced to Optimizely
Graph directly from CMP:

Assets
From the CMP Digital Asset Management (DAM) Platform (and related Field data).
Core fields
id , object_type (asset by default)
asset_type
url

, gcs_file_path , converted_pdf_path

mime_type

(JSON, flexible custom data)
fields (JSON, user-defined fields from the fields table)
metadata
owner_id

, title_tokens_substr (for search)
created_at , last_modified
title

Embeddings (asset_embeddings)
title , description , chunk_text
file_path , mime_type , duration , start_offset_sec , end_offset_sec , page
text_embedding , multimodal_embedding
text_embedding_model

Versioning and renditions
asset_version (with metadata , asset_type , created_at )
rendition ( name , url , mime_type , status , size , metadata , and so on)
Labels ( label_asset )
You can link multiple labels to an asset.

Campaigns
From the campaign table (and related tables).
Core fields

, object_type (campaign by default)
title , title_tokens_substr (searchable)
campaign_id

parent_campaign

(JSON)
field (JSON, user-defined)
creator_user_id , owner_id
created_at , last_modified
metadata

https://support.optimizely.com/hc/en-us/articles/40604966361997-RAG-for-Content-Marketing-Platform-CMP

2/5

3/31/26, 8:31 PM

start_date

, end_date

health_status
brief_converted_pdf_path
reference_id

Embeddings ( campaign_embeddings )
title , description , chunk_text
file_path , mime_type , page

---

## AI Evaluations & Quality

### Evaluations Overview

Opal provides evaluation frameworks to measure agent quality, accuracy, and performance.

3/31/26, 8:31 PM

Articles in this section

Evaluations in Opal overview
Updated 1 month ago

Follow

AI evaluations (evals) in Optimizely Opal provide a structured approach to assessing the
quality and effectiveness of AI-generated content and agent outputs. This capability
ensures that Opal-driven initiatives align with your brand standards and business
objectives, fostering continuous improvement and reliable performance.

Evals
Evals are the systematic process of measuring and analyzing the performance of AI
models and their outputs. In the context of Optimizely Opal, evals are designed to
Assess quality – Determine if Opal-generated content meets predefined standards
for accuracy, relevance, and completeness.
Ensure consistency – Verify that outputs adhere to brand guidelines, tone of voice,
and other stylistic requirements.
Drive improvement – Provide actionable feedback that can be used to refine agent
prompts, configurations, and underlying models.
The primary goal of evals is to build trust in Opal's capabilities by ensuring that the
outputs are consistently high-quality and fit for purpose.

Benefits of evals
Integrating evals into your Opal workflows offer the following key advantages:
Improved Opal output quality – Provide high-quality content and outputs from your
specialized agents consistently.
Enhanced brand consistency – Ensure all Opal-generated materials align with your
brand's voice, style, and messaging.
Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43187503283853-Evaluations-in-Opal-overview

1/3

3/31/26, 8:31 PM

Faster iteration and optimization – Identify areas for improvement and refine agent
performance efficiently.

How evals are used in Opal
Preferred output examples
When a specialized agent executes and produces output, you can designate a specific
execution's output as a preferred output. This preferred output example then serves as a
benchmark against which future outputs from the same agent can be measured. It
represents the desired quality or outcome for a particular task.
Once you set a preferred output, Opal automatically generates a Quality Score for
subsequent agent executions. This score quantifies how closely a new output matches
the designated preferred outputs.
See Preferred output examples.

Evaluation agents
Opal supports the creation of specialized evaluation agents. These agents are designed
with the specific purpose of critiquing the outputs of other agents. They can
Automate feedback – Automatically assess content against predefined criteria (for

### Preferred Output Examples

Define expected outputs to measure agent performance against quality standards.

3/31/26, 8:31 PM

Articles in this section

Preferred output examples
Updated 1 month ago

Follow

Preferred output examples are a core component of AI Evaluations (evals) in Optimizely
Opal, letting you establish a benchmark for the quality of content generated by
specialized agents. By designating preferred output examples, you provide Opal with a
clear standard against which subsequent agent executions can be measured, leading to
an automated quality score.

What is a preferred output example?
A preferred output example is a specific, high-quality output from a specialized agent
execution that you select as a "good" output. This chosen output serves as the gold
standard or reference point for a particular agent. It embodies the desired
characteristics, tone, accuracy, and overall quality you expect from your agent. The
preferred output example should also reflect the desired tool call pattern.
Think of it as providing Opal with an exemplary answer to a question or a perfect example
of a generated asset. Opal then uses this example to understand what "good" looks like
for that specific agent and task.

Purpose and benefits
The primary purpose of preferred output examples is to
Establish a quality benchmark – Define the desired quality level for agent outputs.
Automate quality assessment – Lets Opal automatically score future outputs against
this benchmark.
Monitor performance over time – Track how well an agent consistently meets quality
expectations.
Reduce manual review – Streamline the content creation process by reducing the
need for extensive manual checks.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/43244850788109-Preferred-output-examples

1/6

3/31/26, 8:31 PM

How to create a preferred output example

Creating a preferred output example involves a simple process within the specialized
agent workflow.
1. Execute a specialized agent – Run your specialized agent with a specific prompt or
task.
2. Review the output – Examine the generated output to ensure it meets your quality
standards.
3. Select as preferred output example – Add the output as a preferred output if it is
satisfactory. Once designated, this preferred output becomes the reference point for
all future evaluations of that agent's performance for similar tasks. To do so, complete
the steps in the following sections:
Add preferred output examples manually
Set agent execution as preferred output
Important
To provide valuable output, you should
Add at least three varied preferred output examples.
Use real use cases as examples.

---

## Glossary & Key Terms

### Key Definitions

3/31/26, 8:26 PM

Articles in this section

Optimizely Opal glossary
Updated 1 month ago

Follow

This glossary defines key terms and concepts used in Optimizely Opal. Use it as a
reference when exploring Opal Chat, building agent workflows, or configuring
instruction-based tasks across Optimizely.
Agent – A specialized, pre-configured capability within Opal with clear instructions
and tools to handle specific requests or tasks. They can perform advanced actions,
and you can include them in agent workflows. Examples include the following:
Campaign brief generation agent – Create high-quality briefs that are on-format.
Content translation agent – Convert existing content to a different language,
considering cultural, company, and grammatical differences.
Agent directory – A central hub where you can browse, view, and install default
agents for Optimizely Opal. See Agent directory.
Agent workflow – A predefined, structured sequence of steps and decisions that a
specialized agent within Opal follows to address a specific type of request or achieve
a particular goal.
Ask Opal – A feature available in the global navigation bar of supported Optimizely
products that launches Opal Chat for in-context support, guidance, or content
generation. See Access Optimizely Opal Chat.
Baseline quality score – The lowest acceptable quality percentage you expect the
specialized agent output to achieve. See Baseline quality.
Connection – A link between Opal and a specific Optimizely product instance. A
connection is required for Opal features to function within that product. You must
create a connection before you customize Opal.
Context details – Any additional information provided along with your message that
helps Opal understand the context of your request. This might include your active
Optimizely product, the current page or URL, your organization ID, or any previously
stored data relevant to the conversation. This additional context helps provide more
personalized and relevant responses.

Privacy - Terms

https://support.optimizely.com/hc/en-us/articles/37760119713165-Optimizely-Opal-glossary

1/5

3/31/26, 8:26 PM

Chat agent – An agent primarily designed for real-time interaction with users that
answers questions, provides information, and assists with inquiries in a conversational
manner. It engages in dialogue and is multi-response (not a one-off work). Opal Chat
is a Chat agent.
Credits (also called Opal Credits) – Units that track usage of Optimizely Opal's AIpowered features. You consume credits each time Opal calls an API to an AI model,
such as a large language model (LLM). This includes generating responses, running
agent workflows, retrieving data, or performing AI-driven actions. See Optimizely
Opal credits.
Custom tool – A tool built and maintained by your organization. See Custom tools.
Default agent – A ready-to-use agent built by Optimizely that helps you quickly get
started with common tasks and workflows. See Default agents overview.
Global navigation bar – The horizontal menu available across Optimizely One
products, which includes shortcuts such as Ask Opal and drop-down lists to change
your organization and Optimizely product. See Overview of Opti ID.
History – Your past interactions within the current Opal conversation. By keeping
track of the conversation history, Opal can maintain context, avoid redundant
information, and offer more tailored assistance based on previous requests and
responses.
Instructions – Internal guidelines, rules, and constraints that govern how Opal
behaves and makes decisions. See Instructions overview. These ensure Opal operates
consistently, adheres to best practices, and provides relevant responses. See Sample
instructions for ready-made examples you can copy, customize, and use to create
your own instructions quickly.
New chat – A button in Opal Chat that clears the current session and starts a new
interaction. See Opal Chat user interface. Examples include the following:
You want to discuss a completely new topic.
The conversation has gone off-topic.
You feel Opal is getting confused or stuck.
You want to ensure a clean slate for a critical query.
Opal App – The central interface for accessing Opal's features, including chat,
instructions, agents, tools, and connections.
Opal Chat – The conversational interface where you interact with Opal using natural
language to ask questions, get insights, and perform tasks. See Optimizely Opal Chat.
Opal credits dashboard – The UI where admins can monitor credit usage, allocation,
and remaining balance. See View Opal usage.
Opal SDK – A way to simplify the creation of tools compatible with the Opal tools
management service. See Create custom tools. There are three SDKs currently
available and delivered through the following services:
Python through pip.
JavaScript (TypeScript) through npm.
C# through NuGet.

https://support.optimizely.com/hc/en-us/articles/37760119713165-Optimizely-Opal-glossary

2/5

3/31/26, 8:26 PM

Optimizely Opal – Optimizely's agent orchestration platform that helps you explore
complex questions, provides clear answers about the Optimizely platform, and offers

---

## Additional Resources

### Documentation Structure

- **Folders 00-06**: Feature areas and capabilities
- **System Tools**: Detailed reference for each Optimizely product integration
- **Agents**: Complete agent development guides (Directory, Specialized, Workflow)
- **RAG**: Advanced retrieval and content integration
- **AI Evals**: Quality measurement and improvement

### Getting Help

- **Support**: Visit Optimizely Support Help Center
- **Community**: Connect with other users
- **Training**: Explore Optimizely Academy resources

---

**This comprehensive reference document synthesizes all Optimizely Opal AI documentation into a single LLM-friendly resource for implementation and development guidance.**

Last Updated: March 31, 2026
