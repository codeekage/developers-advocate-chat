import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

//initialize firebase admin previlleges
admin.initializeApp()
//create chat-roooms collection in variable db
const db = admin.firestore().collection('chat-rooms')

// create chat http [POST] request
export const addChats = functions.https.onRequest(async (
  /*http request object*/ request,
  /* http response object*/ response
) => {
  try {
    //store request body object values
    const { username, message } = request.body
    //add new chat to db
    const addNewChat = await db
      .doc('developers-room')
      .collection('chats')
      .add({ username, message })
    //get new chat added to db
    const newChatMessage = await addNewChat.get()
    //terminate request with new chat added to db
    response.send(newChatMessage.data())
  } catch (error) {
    //log error
    console.error(error)
    //terminate request if an error occurs
    response.status(500).send(error)
  }
})

//create an http [GET] request
export const getChats = functions.https.onRequest(async (request, response) => {
  try {
    const result = new Array()
    const getChatMessages = await db
      .doc('developers-room')
      .collection('chats')
      .get()
    getChatMessages.forEach(async messages => {
      await result.push(messages.data())
    })
    response.send(result)
  } catch (error) {
    console.error(error)
    response.status(500).send(error)
  }
})

//background function: triggered when a new node is added to collection
export const onCreateMessage = functions.firestore
  .document('chat-rooms/developers-room/chats/{chatsId}')
  .onCreate((snapshot, context) => {
    const chatId = context.params.chatsId
    console.log(chatId)
    //stores new message in node
    const text: any = snapshot.data()
    //change 'advocate' to 'avocados'
    const message = replaceWithAvocado(text.message)
    //replace advocate to 🥑 with an update function
    return snapshot.ref.update({ message })
  })

//background functions: trigged when a message is edited
export const onUpdateMessage = functions.firestore
  .document('chat-rooms/developers-room/chats/{chatsId}')
  .onUpdate((change, context) => {
    const before: any = change.before.data()
    const after: any = change.after.data()

    if (before.message === after.message) {
      console.log('No changes here')
      return null
    }
    const message = replaceWithAvocado(after.message)
    return change.after.ref.update({ message })
  })

//regex replace function
function replaceWithAvocado(text: string): string {
  const toLower = text.toLowerCase()
  return toLower.replace(/\badvocate\b/g, '🥑')
}
