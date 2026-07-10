const MessageList = ({ messages }) => (
  <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
    {messages.map((msg) => (
      <div key={msg.id} style={{ marginBottom: '8px' }}>
        <b>{msg.username}</b>: {msg.body}
      </div>
    ))}
  </div>
)

export default MessageList