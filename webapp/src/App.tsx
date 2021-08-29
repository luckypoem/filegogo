import React from 'react';
//import logo from './logo.svg';
import './App.css';

import { ProtoHttpToWs } from './lib/util'
import { getServer, getRoom } from './lib/api'
import LibFgg from './libfgg/libfgg'
import log from 'loglevel'
import history from 'history/browser'

import Address from './components/Address'
import File from './components/File'
import Progress from './components/Progress'
import Qrcode from './components/QRCode'

class App extends React.Component {
  fgg: any
  address: string
  progress: number
  total:    number

  sender: boolean
  recver: boolean

  constructor(props: any) {
    super(props)

    this.fgg = new LibFgg()
    this.address = document.location.href
    this.progress = 0
    this.total = 10

    this.sender = false
    this.recver = false
  }

  componentDidMount() {
    log.setLevel("debug")

    getRoom().then(room => {
      const addr = getServer() + room
      this.historyPush(room)
      this.address = document.location.origin + '/' + room
      this.setState(() => {
        return "address"
      })
      this.wsconn(ProtoHttpToWs(addr))
    })
  }
  historyPush(path: string) {
    history.push(path)
  }
  wsconn(addr: string) {
    const fgg = this.fgg
    fgg.onPreTran = (meta: any) => {
      this.total = meta.size
      this.setState(()=>{
        return "total"
      })

    }

    fgg.onRecvFile = () => {
      this.recver = true
      this.setState(() => {return "recver"})
    }

    fgg.tran.onProgress = (c: number) => {
      this.progress += c
      this.setState(()=>{
        return "progress"
      })
    }

    fgg.useWebsocket(addr)
  }
  getfile() {
    this.fgg.useWebRTC({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        }
      ]
    }, () => {

      // TODO:
      // Need Wait to 1s
      setTimeout(() => {
        this.fgg.getfile()
      }, 1000)
    })
    this.fgg.runWebRTC()
  }
  handleFile(files: FileList) {
    this.sender = true

    this.fgg.useWebRTC({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        }
      ]
    }, () => {})

    this.fgg.sendFile(files[0])
  }
  // <img src={logo} className="App-logo" alt="logo" />
  render() {
    return (
      <div className="App">
        <header className="App-header">
        <div className="App-card">
          <Qrcode address={ this.address }></Qrcode>
          <Address address={ this.address }></Address>
          <Progress percent={ this.progress / this.total }></Progress>

          { this.recver
            ? <button className="App-address-button" onClick={ () => { this.getfile() } } >GetFile</button>
            : <File handleFile={ (files: any) => { this.handleFile(files) } } ></File>
          }
        </div>
        </header>
      </div>
    )
  }
}

export default App;
