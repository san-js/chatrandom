import React, {Component} from "react";
import ReactDOM from 'react-dom';
import io from "socket.io-client";

class UserNameInput extends Component {

    constructor(props) {
      super(props);
      this.state = {username: ''};
    }
  
    submitName = ev => {
        ev.preventDefault();
        this.props.onSubmitName(this.state.username);
    } 
  
    render() {
      return (
        <form className="input" onSubmit={(e) => this.submitName(e)}>
            <input autoFocus type="text" ref="user" placeholder="Username" className="form-control" value={this.state.username} 
                onChange={ev => this.setState({username: ev.target.value})} />
            <input type="submit" value="Submit" />
        </form>
      );
    }
}
  
class ChatConsole extends Component {
    constructor(props){
        super(props);
        this.state = {
            message: ''
        };
    }

    componentDidMount() {
        this.scrollToBot();
    }

    componentDidUpdate() {
        this.scrollToBot();
    }

    scrollToBot() {
        ReactDOM.findDOMNode(this.refs.chats).scrollTop = ReactDOM.findDOMNode(this.refs.chats).scrollHeight;
    }
    
    submitMessage = ev => {
        ev.preventDefault();
        this.props.onSubmitMessage(this.state.message);
        this.setState({message: ''});
    } 

    render() {
        return (
            <div>
                <div className="chats" ref="chats">
                {
                    this.props.messages.map( (message) => 
                        <div className='message'> {message} </div>
                    )
                }
                </div>

                <form className="input" onSubmit={(e) => this.submitMessage(e)}>
                    <input autoFocus type="text" ref="msg" placeholder="Message" className="form-control" value={this.state.message} 
                        onChange={ev => this.setState({message: ev.target.value})}/>
                    <input type="submit" value="Submit" />
                </form>
            </div>
        )
    }
}

class Chat extends Component{
    constructor(props){
        super(props);

        this.state = {
            username: '',
            partnerName: '',
            errMessage:'',
            messages: []
        };

        this.socket = io('localhost:5000');

        this.addMessage = data => {
            this.setState({messages: [...this.state.messages, data]});
        };

        this.onSubmitMessage = msg => {
            this.socket.emit('SEND_MESSAGE', this.state.username,msg);
        }
       
        this.onSubmitName = name => {
            this.socket.emit('ADD_USER', name, (status) => {
                (status === 'UserTaken') ? this.setState({errMessage:'That name is already taken!  Please choose another one.'}) 
                                         : this.setState({errMessage:'',username: name});
            });            
        };
    }

    componentWillUnmount() { 
        this.socket.emit('DELETE_USER', this.state.username);
    }

    componentDidMount() {        
        this.socket.on('UPDATE_CHAT', (from, data) => {
            this.addMessage(data);
        });

        this.socket.on('USER_CONNECTED', (name) => {
            this.setState({
                messages: [...this.state.messages, "Your are connected to "+name],
                partnerName: name
            });
        });
    }

    render() {
        let content;
        if(this.state.username.length > 0 && this.state.partnerName.length > 0){
            content = <div>
                        <div>  Name: {this.state.username} </div>
                        <ChatConsole messages={this.state.messages} onSubmitMessage={this.onSubmitMessage}/>;
                    </div>
        } else if(this.state.errMessage.length > 0 || (this.state.username.length === 0 && this.state.partnerName.length === 0)){
            content = <div>
                        <UserNameInput onSubmitName={this.onSubmitName} />
                        <div> {this.state.errMessage} </div>
                      </div>
        } else {
            content = <div>
                        <div>  Name: {this.state.username} </div>
                        <div> No free chat user, You will be connected when a user is available...  </div>
                    </div>                             
        }
        return (
            <div className="chatroom">
                <h3>Ask Wonder</h3>               
                {content}
            </div>
        );
    }

}

export default Chat;
