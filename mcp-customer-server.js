import { createServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import tools from "./rest-tools.json" assert { type: "json" };
import { callRestApi } from "./utils/rest-client.js";

/**
 * Create MCP server
 */
const server = createServer(
  {
    name: "rest-mcp-server",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

/**
 * tools/list handler
 * This tells the agent what tools exist
 */
server.setRequestHandler(
  {
    method: "tools/list"
  },
  async () => {
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  }
);

/**
 * tools/call handler
 * This executes a specific tool
 */
server.setRequestHandler(
  {
    method: "tools/call"
  },
  async (request) => {
    const { name, arguments: args } = request.params;

    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    const response = await callRestApi(tool, args);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2)
        }
      ]
    };
  }
);

/**
 * Start MCP server over stdio
 */
const transport = new StdioServerTransport();
await server.connect(transport);
