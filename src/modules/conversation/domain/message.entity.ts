export default interface Message {
    id: number,
    conversationId : number,
    role: 'user'|'assistant'|'system',
    content: string,
    createdAt: string 
}
