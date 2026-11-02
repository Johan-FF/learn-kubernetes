hazme un resumen de este capítulo:

Getting started
Prerequisites
Attendees are expected to have completed DevOps with Docker(opens in a new tab)
 or have Docker and Docker Compose experience. In addition, experience with web development, such as Full Stack Web Development or equivalent, is required. Attendees need admin/superuser privileges to complete the exercises and the examples of the material on their computers.

Enrollment
You do not need to enroll to study in the course. You can enroll only after you have completed the course, see the Getting ECTS credits and the certificate below.

Course material
The course material is meant to be read part by part from start to finish. The material contains exercises, which are placed so that the preceding material provides enough information for solving each exercise. Do the exercises as you go through the material. As you progress further, you will be increasingly searching for information on the internet. You should also supplement your knowledge with the official documentation(opens in a new tab)
!

The course material is written using macOS, so some instructions may lack platform-specific details. Please make an improvement suggestion to the course material in case you find any mistakes or wish to add something.

Improvements and feedback to the course material
We welcome contributions to the course material from students and other members of the DevOps community! If you notice any mistakes, typos, or errors in the material, please consider submitting a correction or clarification request by pressing the Give feedback button, which gives you two choices


In case of e.g., typos, it is preferable to select the Improve Material that makes the material "editable", and you may send the improvement suggestions for approval.

Completion and grading
To complete the course, complete the exercises in Chapters 2-6 before the deadline of 31st January 2027.

The total workload of the course is about 100 hours depending on your background.

Course size is 5 ECTS credits. The course has a total of 55 exercises, and the grade will depend on the number of submitted exercises:

gradeexercises550445340235130
Google Cloud Credits
In Chapter 4, we will use Google Kubernetes Engine. It is not free, but everyone starting with Google Cloud has $300 worth of free credits. See your options here(opens in a new tab)
.

If you have used all $300 Google Cloud credits, there is nothing we can do. You can complete chapters 2-3, and at least some exercises in chapters 5 and 6 with just a local cluster, but in chapter 4, the use of Google Kubernetes Engine is mandatory.

You may also very well use another cloud provider but we do not have any instructions on how to get up and running on other providers.

Help for exercises or course practicalities
This course has a Discord group where we discuss everything about the course. Support is available almost 24/7, with the discussion being in both English and Finnish.

Join our DevOps with Kubernetes Discord channel: https://study.cs.helsinki.fi/discord/join/kubernetes(opens in a new tab)
.

All inappropriate, degrading, or discriminatory comments on the channel are prohibited and will lead to action taken against the commenter.

Submitting exercises
During the course, you are building a set of apps and Kubernetes configs for those. You save all the apps and configs to one or several GitHub repositories.

One example to organize the repository is https://github.com/mluukkai/KubernetesSubmissions that looks like this


This example shows one possible way to organize the repository: there is one directory per application.

After each exercise, you should make a GitHub release that has a tag that matches the exercise number. E.g., the example has the following releases:


The README.md file of the repository should include a link to the relevant app for each exercise, e.g., the link 1.1. points to log_output since that is the directory where the application of that exercise is stored. The link has to point to the corresponding release:


As can be seen, 1.1. is a link to the version of the correponding app in the release 1.1.

If you are using multiple repositories for exercises, your main repository should still have the links for each exercise. As you can see, in the above example, 1.5. is a link to another repository.

Besides all this, each of the applications should have a README.md that describes how the application is started up and other relevant info. The readme could look like the following


Make sure that the repository is available to the GitHub user mattiluukkainen. We prefer public repositories, but if you want to keep your experience secret, you can create a private repository and add mattiluukkainen(opens in a new tab)
 as a collaborator.

It is extremely important that you follow the above

- make a release for every exercise (with the same name as the exercise number)
- make a link from your main repository README.md to each exercise, the link points to the corresponding release and the directory that is relevant for the exercise
- repository should be accessible for GitHub user mattiluukkainen
In most of the exercise you are only asked to submit a link to the GitHub release corresponding to the exercise. Some of the exercises might ask you also to submit something more besides to the commit links.

The first and the last exercises of the course are special ones. In the first, it is checked that you have read this page and are safe to proceed with the course. The last exercise of the course is used to signal that you are done with the course.

Your exercises are reviewed when you submit the last exercise, and if everything is more or less ok, you will be graded and the cert and university credits are available to you.

Remember not to cheat in exercises! If, for example, multiple students are submitting the same code, the issue is handled according to the policy on plagiarism(opens in a new tab)
 of the University of Helsinki.

Getting ECTS credits and the certificate
After you have completed the exercises and those are graded, you can get the ECTS credits as follows

University of Helsinki degree students and exchange students
1. Enroll directly through your Sisu account (Sisu: Structure of studies).
2. Complete all required exercises.
Others
1. Complete all required exercises.
2. Go to the course front page.  
3. Scroll down until you see an element that says Congratulations!  
4. Click the REGISTER  button.  
5. Fill in the open university (University of Helsinki) enrolment form. Use the same email address that you used to complete the course.
6. The credits are usually registered in the University of Helsinki’s study register within two days of enrolment.  
The course certificate is available also at the course front page.

Using LLM:s
Large language models such as ChatGPT(opens in a new tab)(opens in a new tab)
, Claude(opens in a new tab)(opens in a new tab)
 and GitHub Copilot(opens in a new tab)(opens in a new tab)
 have proven to be very useful in software development.

Personally, I mainly use Copilot, which integrates seamlessly with VS Code thanks to the plugin(opens in a new tab)(opens in a new tab)
 and has proven out to be quite useful also in the context of Docker.

There are many use cases for LLM usage. For example, you can

- ask LLM for various configurations
- ask LLM to clarify what a given configuration exactly does
- paste error messages and configurations to LLM and ask where the problem might be
- ask clarifications about fundamental concepts
The degree of usefulness of the hints provided by Copilot and other language models varies. Perhaps the biggest problem with language models is hallucination)(opens in a new tab)
, they sometimes generate completely convincing-looking answers, which, however, are completely wrong. When programming, of course, the hallucinated code is often caught quickly if the code does not work. More problematic situations are those where the code or configurations generated by the language model seem to work, but it contains bugs that are more difficult to detect, e.g. security vulnerabilities.

Another problem in applying language models to software development is that it is difficult for language models to "understand" larger projects, and, e.g., to generate functionality that would require changes to several files. Language models are also currently unable to generalize code, i.e,. if the code has, for example, existing functions or components that the language model could use with minor changes for the requested functionality, the language model will not bend to this. The result of this can be that the code base deteriorates, as the language models generate a lot of repetition in the code, see more e.g. here(opens in a new tab)
.

When using language models, the responsibility always stays with the programmer.

The rapid development of language models puts the student in a challenging position: is it worth and is it even necessary to learn things at a detailed level, when you can get almost everything ready-made from language models?

At this point, it is worth remembering the old wisdom of Brian Kernighan(opens in a new tab)
, co-author of The C Programming Language:


In other words, since debugging is twice as difficult as programming, it is not worth programming such code that you can only barely understand. How can debugging even be possible in a situation where programming is outsourced to a language model and the software developer does not understand the debugged code at all? The exact same thing applies to configuring Kubernetes and might actually be even more severe, if you do not understand the fundamentals, debugging hard Kubernetes-related issues is just impossible.

So far, the development of language models and artificial intelligence is still at the stage where they are not self-sufficient, and the most difficult problems are left for humans to solve. Because of this, even novice developers must learn fundamentals really well, just in case. It may be that, despite the development of language models, even more in-depth knowledge is needed. Artificial intelligence does the easy things, but humans need to sort out the most complicated messes caused by AI. GitHub Copilot is a very well-named product, it's Copilot, a second pilot who helps the main pilot in an aircraft. The programmer is still the main pilot, the captain, and bears the ultimate responsibility.

About the material
The DevOps with Kubernetes course was created by the esteemed Docker captain Jami Kousa(opens in a new tab)
 with the help of the University of Helsinki's Tietojenkäsittelytieteen osaston sovelluskehitysakatemia (Toska(opens in a new tab)
).

As of 2024, the course was handed off to Matti Luukkainen, the creator of Full Stack Open. You can contact him at matti.luukkainen@helsinki.fi(opens in a new tab)
.

This material is licensed under Creative Commons BY-NC-SA 3.0 -licence(opens in a new tab)
, so you can freely use and distribute the material, as long as the original creators are credited. If you make changes to the material and you want to distribute the altered version, it must be licensed under the same license. Usage of the material for commercial use is prohibited without permission.Getting started
Prerequisites
Attendees are expected to have completed DevOps with Docker(opens in a new tab)
 or have Docker and Docker Compose experience. In addition, experience with web development, such as Full Stack Web Development or equivalent, is required. Attendees need admin/superuser privileges to complete the exercises and the examples of the material on their computers.

Enrollment
You do not need to enroll to study in the course. You can enroll only after you have completed the course, see the Getting ECTS credits and the certificate below.

Course material
The course material is meant to be read part by part from start to finish. The material contains exercises, which are placed so that the preceding material provides enough information for solving each exercise. Do the exercises as you go through the material. As you progress further, you will be increasingly searching for information on the internet. You should also supplement your knowledge with the official documentation(opens in a new tab)
!

The course material is written using macOS, so some instructions may lack platform-specific details. Please make an improvement suggestion to the course material in case you find any mistakes or wish to add something.

Improvements and feedback to the course material
We welcome contributions to the course material from students and other members of the DevOps community! If you notice any mistakes, typos, or errors in the material, please consider submitting a correction or clarification request by pressing the Give feedback button, which gives you two choices


In case of e.g., typos, it is preferable to select the Improve Material that makes the material "editable", and you may send the improvement suggestions for approval.

Completion and grading
To complete the course, complete the exercises in Chapters 2-6 before the deadline of 31st January 2027.

The total workload of the course is about 100 hours depending on your background.

Course size is 5 ECTS credits. The course has a total of 55 exercises, and the grade will depend on the number of submitted exercises:

gradeexercises550445340235130
Google Cloud Credits
In Chapter 4, we will use Google Kubernetes Engine. It is not free, but everyone starting with Google Cloud has $300 worth of free credits. See your options here(opens in a new tab)
.

If you have used all $300 Google Cloud credits, there is nothing we can do. You can complete chapters 2-3, and at least some exercises in chapters 5 and 6 with just a local cluster, but in chapter 4, the use of Google Kubernetes Engine is mandatory.

You may also very well use another cloud provider but we do not have any instructions on how to get up and running on other providers.

Help for exercises or course practicalities
This course has a Discord group where we discuss everything about the course. Support is available almost 24/7, with the discussion being in both English and Finnish.

Join our DevOps with Kubernetes Discord channel: https://study.cs.helsinki.fi/discord/join/kubernetes(opens in a new tab)
.

All inappropriate, degrading, or discriminatory comments on the channel are prohibited and will lead to action taken against the commenter.

Submitting exercises
During the course, you are building a set of apps and Kubernetes configs for those. You save all the apps and configs to one or several GitHub repositories.

One example to organize the repository is https://github.com/mluukkai/KubernetesSubmissions that looks like this


This example shows one possible way to organize the repository: there is one directory per application.

After each exercise, you should make a GitHub release that has a tag that matches the exercise number. E.g., the example has the following releases:


The README.md file of the repository should include a link to the relevant app for each exercise, e.g., the link 1.1. points to log_output since that is the directory where the application of that exercise is stored. The link has to point to the corresponding release:


As can be seen, 1.1. is a link to the version of the correponding app in the release 1.1.

If you are using multiple repositories for exercises, your main repository should still have the links for each exercise. As you can see, in the above example, 1.5. is a link to another repository.

Besides all this, each of the applications should have a README.md that describes how the application is started up and other relevant info. The readme could look like the following


Make sure that the repository is available to the GitHub user mattiluukkainen. We prefer public repositories, but if you want to keep your experience secret, you can create a private repository and add mattiluukkainen(opens in a new tab)
 as a collaborator.

It is extremely important that you follow the above

- make a release for every exercise (with the same name as the exercise number)
- make a link from your main repository README.md to each exercise, the link points to the corresponding release and the directory that is relevant for the exercise
- repository should be accessible for GitHub user mattiluukkainen
In most of the exercise you are only asked to submit a link to the GitHub release corresponding to the exercise. Some of the exercises might ask you also to submit something more besides to the commit links.

The first and the last exercises of the course are special ones. In the first, it is checked that you have read this page and are safe to proceed with the course. The last exercise of the course is used to signal that you are done with the course.

Your exercises are reviewed when you submit the last exercise, and if everything is more or less ok, you will be graded and the cert and university credits are available to you.

Remember not to cheat in exercises! If, for example, multiple students are submitting the same code, the issue is handled according to the policy on plagiarism(opens in a new tab)
 of the University of Helsinki.

Getting ECTS credits and the certificate
After you have completed the exercises and those are graded, you can get the ECTS credits as follows

University of Helsinki degree students and exchange students
1. Enroll directly through your Sisu account (Sisu: Structure of studies).
2. Complete all required exercises.
Others
1. Complete all required exercises.
2. Go to the course front page.  
3. Scroll down until you see an element that says Congratulations!  
4. Click the REGISTER  button.  
5. Fill in the open university (University of Helsinki) enrolment form. Use the same email address that you used to complete the course.
6. The credits are usually registered in the University of Helsinki’s study register within two days of enrolment.  
The course certificate is available also at the course front page.

Using LLM:s
Large language models such as ChatGPT(opens in a new tab)(opens in a new tab)
, Claude(opens in a new tab)(opens in a new tab)
 and GitHub Copilot(opens in a new tab)(opens in a new tab)
 have proven to be very useful in software development.

Personally, I mainly use Copilot, which integrates seamlessly with VS Code thanks to the plugin(opens in a new tab)(opens in a new tab)
 and has proven out to be quite useful also in the context of Docker.

There are many use cases for LLM usage. For example, you can

- ask LLM for various configurations
- ask LLM to clarify what a given configuration exactly does
- paste error messages and configurations to LLM and ask where the problem might be
- ask clarifications about fundamental concepts
The degree of usefulness of the hints provided by Copilot and other language models varies. Perhaps the biggest problem with language models is hallucination)(opens in a new tab)
, they sometimes generate completely convincing-looking answers, which, however, are completely wrong. When programming, of course, the hallucinated code is often caught quickly if the code does not work. More problematic situations are those where the code or configurations generated by the language model seem to work, but it contains bugs that are more difficult to detect, e.g. security vulnerabilities.

Another problem in applying language models to software development is that it is difficult for language models to "understand" larger projects, and, e.g., to generate functionality that would require changes to several files. Language models are also currently unable to generalize code, i.e,. if the code has, for example, existing functions or components that the language model could use with minor changes for the requested functionality, the language model will not bend to this. The result of this can be that the code base deteriorates, as the language models generate a lot of repetition in the code, see more e.g. here(opens in a new tab)
.

When using language models, the responsibility always stays with the programmer.

The rapid development of language models puts the student in a challenging position: is it worth and is it even necessary to learn things at a detailed level, when you can get almost everything ready-made from language models?

At this point, it is worth remembering the old wisdom of Brian Kernighan(opens in a new tab)
, co-author of The C Programming Language:


In other words, since debugging is twice as difficult as programming, it is not worth programming such code that you can only barely understand. How can debugging even be possible in a situation where programming is outsourced to a language model and the software developer does not understand the debugged code at all? The exact same thing applies to configuring Kubernetes and might actually be even more severe, if you do not understand the fundamentals, debugging hard Kubernetes-related issues is just impossible.

So far, the development of language models and artificial intelligence is still at the stage where they are not self-sufficient, and the most difficult problems are left for humans to solve. Because of this, even novice developers must learn fundamentals really well, just in case. It may be that, despite the development of language models, even more in-depth knowledge is needed. Artificial intelligence does the easy things, but humans need to sort out the most complicated messes caused by AI. GitHub Copilot is a very well-named product, it's Copilot, a second pilot who helps the main pilot in an aircraft. The programmer is still the main pilot, the captain, and bears the ultimate responsibility.

About the material
The DevOps with Kubernetes course was created by the esteemed Docker captain Jami Kousa(opens in a new tab)
 with the help of the University of Helsinki's Tietojenkäsittelytieteen osaston sovelluskehitysakatemia (Toska(opens in a new tab)
).

As of 2024, the course was handed off to Matti Luukkainen, the creator of Full Stack Open. You can contact him at matti.luukkainen@helsinki.fi(opens in a new tab)
.

This material is licensed under Creative Commons BY-NC-SA 3.0 -licence(opens in a new tab)
, so you can freely use and distribute the material, as long as the original creators are credited. If you make changes to the material and you want to distribute the altered version, it must be licensed under the same license. Usage of the material for commercial use is prohibited without permission.