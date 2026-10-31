import { Component, type ErrorInfo, type ReactNode } from "react";

/** Public previews fail visibly if a render throws, instead of silently leaving a blank battlefield.
 * This does not grant controls over the live multiplayer server. */
export class GameSceneBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError(): {failed: boolean} { return {failed:true}; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CrowdQuest public scene failed to render", error, info.componentStack);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section className="game-scene-recovery" role="alert">
      <div><span>⚠ GAME DISPLAY</span><h3>The scene could not be displayed</h3>
      <p>Your browser encountered an unexpected rendering error. You can retry the display or reload the demo.</p>
      <div className="game-scene-recovery-actions"><button type="button" onClick={()=>this.setState({failed:false})}>Retry scene</button><button type="button" onClick={()=>window.location.reload()}>Reload game</button></div></div>
    </section>;
  }
}
