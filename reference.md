Based on an audit of the provided technical reports, the proposed architecture for an agentic AEC (Architecture, Engineering, and Construction) system is a multi-layered "Sidecar" model designed to bridge modern AI protocols with legacy CAD environments.
### 1. Core Architecture Audit
The system is built on a four-layer stack to ensure isolation and scalability:
*
**Layer 1: The MCP Host (Frontend)** – A conversational AI interface (e.g., Chainlit) that orchestrates the Large Language Model (LLM) and manages tool execution requests .
*
**Layer 2: The MCP Server (Middleware)** – A Python-based process using `fastmcp` or `flask` that acts as a semantic bridge, exposing "Atomic Tools" to the LLM .
*
**Layer 3: The .NET Sidecar (IPC Bridge)** – A custom-built plugin running inside AutoCAD or Revit that hosts an internal HTTP listener to receive commands from the Python layer.
*
**Layer 4: The CAD Kernel (Execution)** – The native AutoCAD/Revit engine that executes geometric operations on the main thread .
### 2. Granular Implementation Breakdown
To build this application with high granularity, the following components must be implemented:
#### A. The Semantic Bridge (MCP Layer)
*
**Transport Choice**: Utilize **Server-Sent Events (SSE) over HTTP** instead of `stdio`. In a multi-user RDP environment, `stdio` is prone to breakage during session reconnections, whereas SSE allows the MCP server to run as a persistent "sidecar" .
*
**Atomic Tool Design**: Avoid "God Tools" that perform complex tasks in one go. Instead, expose low-level functions like `revit_create_wall` or `acad_draw_polyline`. This allows the LLM to use its reasoning to chain multiple calls together to fulfill complex requests .
*
**State Management**: Use **MCP Resources** to inject the active CAD session state (e.g., active level, selected elements) into the LLM's context window via a URI like `mcp://active_document/stats` .
#### B. The .NET Sidecar (AutoCAD/Revit Plugin)
*
**In-Process Listener**: Build a `.NET` plugin implementing `IExtensionApplication` to start an `HttpListener` immediately upon application launch .
*
**Thread Marshaling (The STA Problem)**: Because CAD applications are single-threaded (STA model), background thread requests must be marshaled to the main thread .
*
**AutoCAD**: Use a `ConcurrentQueue` and process it during the `Application.Idle` event.
*
**Revit**: Use the `ExternalEvent` framework to safely execute API calls from the external listener.
#### C. Cloud Infrastructure (AWS RDP)
*
**Instance Selection**: Use **Amazon EC2 G4dn** instances (NVIDIA T4 GPUs) to prevent application hanging during heavy API execution. For 50 concurrent users, deploy approximately **13 g4dn.4xlarge instances**, hosting 4 users per instance to balance cost and performance .
*
**Dynamic Port Allocation**: To avoid port conflicts in a multi-session environment, assign ports dynamically using the Windows Session ID: `Base_Port (20000) + Session_ID`. Use a PowerShell logon script to set an environment variable (`MCP_LISTENER_PORT`) that the plugins can read .
### 3. Proposed "Edits" and Enhancements
Based on the audit, the following refinements are recommended for a more robust system:
*
**Concurrency Control**: Instead of a naive queue in the CAD plugin, implement an `asyncio.Lock` or semaphore in the **Python MCP Server**. This ensures the agent waits for one geometric operation to complete and return a result before attempting the next, maintaining model state consistency.
*
**Enhanced Security**: While the reports suggest HTTP for simplicity, for production, implement **JWT-based authentication** or a shared secret between the Python middleware and the .NET Sidecar to prevent unauthorized local processes from sending commands to the CAD engine.
* **Performance Optimization**: Exclude Autodesk Journal and `%TEMP%` folders from FSLogix network profiles. Redirect them to the instance's **local NVMe storage** to minimize latency during high-speed automation logging .
*
**Economic Hybridization**: For computationally expensive batch tasks (e.g., bulk file translation), offload the work to **Autodesk Platform Services (APS)** instead of consuming local RDP resources, using the MCP server to orchestrate the hand-off.