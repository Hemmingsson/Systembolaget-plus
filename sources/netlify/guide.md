# Netlify

Netlify MCP provides access to Netlify sites, projects, deployments, teams, environment settings, and related management workflows.

## Scope

Use this source when you need:
- deployment and site management in Netlify
- team, project, and environment inspection
- Netlify-oriented operational workflows from an MCP client
- a bridge to Netlify resources without manual dashboard navigation

## Guidelines

- Some operations are mutating; confirm intent before changing sites or settings
- If authentication fails, a Netlify personal access token may be required in environment variables
- Prefer read-only inspection first when exploring existing sites or teams
- Keep secrets and environment variable values out of shared outputs unless necessary

## Examples

- List available Netlify sites and recent deploys
- Inspect project configuration before making a change
- Manage a deployment workflow from within an MCP-enabled session
