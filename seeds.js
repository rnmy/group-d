const mongoose = require("mongoose");
const Event = require("./models/event");
const Group = require("./models/group");
const User = require("./models/user");

const events = [
    {
      name: "The Square Small Business Hackathon",
      url: "https://square.devpost.com/?ref_feature=challenge&ref_medium=home",
      desc: "Calling all developers! The small business community needs your help right now more than ever. They’re looking for solutions to help them adjust their businesses in this new environment. They need to adapt to a new world of contactless commerce, and many are struggling to make the transition or innovate. This is where you come in. We’re excited to announce The Square Small Business Hackathon, where we invite developers to create applications for small businesses to help them adapt and grow through this moment. Choose from any of the four categories: Retail, Food & Beverage, Healthcare, Services & Other, and build for web or mobile, using any language you prefer and one of Square’s APIs and/or SDKs (Australia | Canada | Japan | United Kingdom | United States). First place winners in each category receive $3,000 for themselves, $3,000 to donate to a small business of their choice, a Google Home device, Square Swag, and promotion on Square’s Twitter and YouTube channel.",
      requirements: "Anybody from Mindanao (residing, birthplace, working) or anyone who has a heart for Mindanao can take part in this virtual event. All you need is a stable internet connection, mobile phone, tablet or laptop where you can access the video conferences, workshop tools and applications, and programs that can help you and your team in ideating and creating your project. Get ready to meet people from within and outside your locality! Connect, ideate and make new friends in the process.",
      prizes: "$3,000 USD, $3,000 USD donation directed to seller of choice, one Google Home device, Social promotion by Square, 60 min. meeting with Square product team (or other to discuss the winning app), Square swag for up to 5 teammates",
      date: "2019-08-15",
      minGroupSize: 1,
      maxGroupSize: 5
    },
    {
      name: "HackBangPH",
      url: "https://hackbangph.devpost.com/?ref_feature=challenge&ref_medium=home",
      desc: "A Step Towards the Next Normal. This 4-day virtual hackathon will be a meeting of the minds, a platform that enables connections between the thinkers, the doers, the movers and the shakers. This hackathon is the first virtual hackathon in the Philippines, and a pioneering concept in the Mindanao region, where we will explore practical and innovative solutions that respond to a specific problem within a challenge area, through the use of science and technology. This will go down in history as the event that moved the needle, so we can can safely latch on to a new life now and after the crisis.",
      requirements: "Anybody from Mindanao (residing, birthplace, working) or anyone who has a heart for Mindanao can take part in this virtual event. All you need is a stable internet connection, mobile phone, tablet or laptop where you can access the video conferences, workshop tools and applications, and programs that can help you and your team in ideating and creating your project. Get ready to meet people from within and outside your locality! Connect, ideate and make new friends in the process.",
      prizes: "Highlights of viable ideas for implementation for incubation.",
      date: "2020-06-1",
      minGroupSize: 2,
      maxGroupSize: 4
    },
    {
      name: "Facebook Hackathon: AI",
      url: "https://fbai2.devpost.com/?ref_feature=challenge&ref_medium=home",
      desc: "Build AI natural language interactions with Wit.ai. Facebook is passionate about bringing the world closer together by advancing artificial intelligence - connecting people to what they care about, powering new, meaningful experiences, and advancing the state-of-the-art through open research and accessible tooling. Whether you’re just getting started, or an experienced pro, we invite you to submit a solution featuring natural language interactions that leverage the Wit.ai platform. Not only is this a chance to put your skills to the test and preview the refreshed Wit.ai, but you’ll also discover that you don't need to be an AI/ML developer to build powerful natural language experiences that can solve real problems right away. In addition, you will connect with a global community of like-minded developers, benefit from educational resources and be in the running to win some awesome cash prizes. We’ll also be providing a free swag giveaway* to each team member from an eligible submission.",
      requirements: "What to build: Use Wit.ai to build Natural Language experiences that can help people's lives. As we see natural language extend experiences on connected devices, we encourage you to build solutions that connect people and drive greater productivity. Whether it’s local discovery, small businesses serving their neighborhoods, or learning a new skill with your friend - we believe the true potential of this platform is unlocked when we build new and engaging ways for our users to connect with products they love.",
      prizes: "$7,000 in prizes First Place • $3,000 USD • At least one 30-minute virtual meeting with a Facebook engineer • Oculus Quest 64GB VR headset (ARV: $399 USD; 1 per individual, 4 max per Org or Team) Second Place • $2,500 USD Third Place • $1,500 USD",
      date: "2021-03-1",
      minGroupSize: 1,
      maxGroupSize: 4
    },
    {
      name: "Airtable Block Contest",
      url: "https://airtable.devpost.com/?ref_feature=challenge&ref_medium=home",
      desc: "Since the invention of the graphical user interface more than 40 years ago, the elements required to build an application have not fundamentally changed. Even with the advent of cloud computing and hosted services, the effort required to build a full-stack web app is immense. The first thing you have to do is build a database. Then you need to build a modern user interface for editing information. You need to create flexible views that can be filtered or sorted by users. User needs change so you need to create the ability to add custom tables and fields. Once all the basic stuff is in place you need to add commenting and sharing, etc. The list is long. If you want a modern, authenticated, real-time CRUD interface for users and admins, it can take up to 90% of your effort. Only the remaining 10% of your time is spent building the actual logic and components that make your app unique. Today, Airtable is kicking off the developer preview of Custom Blocks with a $100,000 developer contest. With Custom Blocks, we're letting developers increase the power of Airtable by building highly composable components on top of our end-user-friendly real-time database. Now you can spend 100% of your time focused on what makes your app unique and leave the rest to Airtable. The best part? Custom Blocks are built with Javascript and React. You can leverage npm's 1,200,000+ modules to build almost anything you can imagine.",
      requirements: "Please refer to the Eligibility section of the Official Rules",
      prizes: "Blocks for Business Teams (5 winners) Blocks for Education or Non-Profit (2 winners) Wildcard (2 winners) Each winner receives $10,000. The best overall submission from all categories wins an additional $10,000. Each Custom Block you build can only be submitted to one category. However, you are allowed to submit multiple blocks to the same category and compete in all categories. That being said, we recommend you focus on quality over quantity of submissions.",
      date: "2020-07-15",
      minGroupSize: 1,
      maxGroupSize: 1
    }
];

function seedDB() {
  Event.deleteMany({}, (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log("REMOVED EVENTS")
      events.forEach((seed) => {
        Event.create(seed, (err, event) => {
          if(err) {
            console.log(err)
          } else {
            console.log("Created event")
            User.deleteMany({}, (err) => {
              if(err) {
                console.log(err);
              } else {
                console.log("REMOVED USERS")
                Group.deleteMany({}, (err) => {
                  if(err) {
                    console.log(err);
                  } else {
                    console.log("REMOVED GROUPS")
                  }
                })
              }
            })
          }
        })
      })
    }
  })
}

// function seedDB(){
//     Event.deleteMany({}, (err) => {
//         if(err){
//             console.log(err);
//         } else {
//             console.log("REMOVED EVENTS")
//             events.forEach((seed) => {
//                 Event.create(seed, (err, event) => {
//                     if(err){
//                         console.log(err);
//                     } else {
//                       Group.create(
//                         {
//                           name: "Group 1",
//                           size: 1
//                         }, (err, group) => {
//                           if (err) {
//                             console.log(err)
//                           } else {
//                             User.create(
//                               {
//                                 name: "Jane",
//                                 email: "jane@brown.edu.sg",
//                                 username: "plainjane",
//                               }, (err, user) => {
//                                 if(err) {
//                                   console.log(err)
//                                 } else {
//                                   group.users.push(user)
//                                   group.save()
//                                   console.log("Created group")
//                                   event.groups.push(group)
//                                   event.save()
//                                   console.log("Created event")
//                                 }
//                               }
//                             )
//                           }
//                         }
//                       )
//                     }
//                   }
//                 )
//               }
//             )
//           }
//         }
//       )
//     }

module.exports = seedDB;
