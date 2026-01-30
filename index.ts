import { createOpencode } from "@opencode-ai/sdk"

const { client } = await createOpencode({
    port: 4099
})
const tools = await client.tool.list({
    query: {
        provider: "zai-coding-plan",
        model: "glm-4.7"
    }
})
console.log("tools, tools", tools)
// return 
// const session = await client.session.create()

// const result = await client.session.promptAsync({
//     path: {
//         id: session.data?.id ?? ""
//     },
//     body: {
//         model: {
//             providerID: "zai-coding-plan",
//             modelID: "glm-4.7"
//         },
//         parts: [{
//             type: "text",
//             text: "give me information about standard and guidelines from code policy"
//         }]
//     }
// })
// // const events = await client.event.subscribe()
// const events = await client.event.subscribe()
// for await (const event of events.stream) {
//     console.log("Event:", event.type, event.properties)
    
//     // Handle specific event types
//     // if (event.type === "message" || event.type === "response") {
//     //     console.log("Response received:", event.properties)
//     // }
    
//     // // Break when done (adjust based on your event structure)
//     // if (event.type === "done" || event.type === "end") {
//     //     break
//     // }
// }