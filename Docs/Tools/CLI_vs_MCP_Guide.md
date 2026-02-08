# CLI vs MCP: Development Tools Guide
**AquaBotIO | Development Reference**
**Version 1.0 | February 2026**

---

## Overview

This guide outlines when to use **CLI (Command Line Interface)** tools versus **MCP (Model Context Protocol)** servers for managing Supabase, Stripe, GitHub, and Vercel in the AquaBotIO project.

---

## Quick Comparison

| Aspect | CLI | MCP |
|--------|-----|-----|
| **Who uses it** | You directly | AI assistant (on your behalf) |
| **Interface** | Terminal commands | Protocol/API |
| **Execution** | Manual, step-by-step | Automated by AI |
| **Context** | Limited to command output | Rich, structured context |
| **Use case** | Direct tool control | AI-powered automation |

---

## Service-Specific Recommendations

### **Supabase** — Prefer MCP for Most Tasks ✅

**Official MCP Server:** Available via Supabase

#### Use MCP For:
- ✅ Database queries and migrations
- ✅ Log retrieval and debugging
- ✅ Security advisor checks
- ✅ Table management and schema exploration
- ✅ Edge function debugging
- ✅ Real-time subscription monitoring

#### Use CLI For:
- ✅ Local development (`supabase start`, `supabase stop`)
- ✅ Initial project setup (`supabase init`)
- ✅ Migration file generation (`supabase migration new`)
- ✅ Database reset (`supabase db reset`)
- ✅ Linking projects (`supabase link`)

**Setup:** Install Supabase MCP server in Cursor for AI-assisted database operations.

---

### **Stripe** — Prefer MCP for Operations ✅

**Official MCP Server:** Available (Public Preview)

#### Use MCP For:
- ✅ Customer management and lookup
- ✅ Product/price creation and updates
- ✅ Webhook testing and debugging
- ✅ Balance retrieval
- ✅ Dispute handling
- ✅ Subscription management
- ✅ Payment intent creation
- ✅ Knowledge base searches

#### Use CLI For:
- ✅ Webhook forwarding (`stripe listen --forward-to`)
- ✅ One-off testing/debugging
- ✅ Triggering test events (`stripe trigger`)
- ✅ Log streaming (`stripe logs tail`)

**Setup:** Install Stripe MCP server in Cursor for AI-assisted billing operations.

---

### **GitHub** — Use CLI (No Official MCP Yet) ⚠️

**Official MCP Server:** Not available

#### Use CLI For:
- ✅ All git operations (`git push`, `git commit`, `git pull`)
- ✅ GitHub CLI (`gh pr create`, `gh issue list`)
- ✅ Repository management
- ✅ Branch operations
- ✅ Pull request workflows
- ✅ Issue management

#### Consider Custom MCP If:
- You need AI-driven GitHub automation
- You want conversational PR creation
- You need AI to understand repository context

**Note:** GitHub may release an official MCP server in the future. Monitor for updates.

---

### **Vercel** — Hybrid Approach 🔄

**MCP Support:** Can deploy custom MCP servers to Vercel

#### Use CLI For:
- ✅ Deployments (`vercel deploy`)
- ✅ Environment variable management (`vercel env`)
- ✅ Project linking (`vercel link`)
- ✅ Log streaming (`vercel logs`)
- ✅ Domain management
- ✅ Preview deployments

#### Use MCP If:
- You deploy a custom MCP server for AI-driven deployments
- You want AI to understand deployment context
- You need conversational deployment workflows

**Current Recommendation:** Stick with CLI for Vercel operations until a custom MCP workflow proves necessary.

---

## General Guidelines

### Use MCP When:
- ✅ You want AI assistance with operations
- ✅ You need contextual, conversational interactions
- ✅ You're doing exploratory work or debugging
- ✅ You want the AI to understand your project context
- ✅ You're working with complex queries or operations
- ✅ You need help understanding service-specific concepts

### Use CLI When:
- ✅ You need precise control over commands
- ✅ You're scripting or automating workflows
- ✅ You're doing local development setup
- ✅ You need fast, direct execution
- ✅ You're running one-off commands
- ✅ You need to see raw output immediately

---

## Recommended Setup for AquaBotIO

### Phase 1: Essential MCP Servers
1. **Supabase MCP** — Set up for database operations and debugging
2. **Stripe MCP** — Set up for billing operations and testing

### Phase 2: Keep CLI Tools
3. **Vercel CLI** — Continue using for deployments
4. **GitHub CLI** — Continue using for version control

### Phase 3: Evaluate Custom Solutions
5. **Custom MCP** — Consider if you need AI-driven GitHub or Vercel workflows

---

## Installation Quick Reference

### Supabase MCP
```bash
# Install via Cursor MCP settings
# Or use Supabase's one-click installation
```

### Stripe MCP
```bash
# Install via Cursor MCP settings
# Available for Cursor, VS Code, Claude Code, ChatGPT
```

### CLI Tools (if not already installed)
```bash
# Supabase CLI
brew install supabase/tap/supabase

# Stripe CLI
brew install stripe/stripe-cli/stripe

# Vercel CLI
npm i -g vercel

# GitHub CLI
brew install gh
```

---

## Workflow Examples

### Example 1: Database Migration (MCP Preferred)
**With MCP:** "Create a migration to add a `notifications` table with columns for user_id, message, and read status"

**With CLI:** 
```bash
supabase migration new add_notifications_table
# Then manually write SQL
```

### Example 2: Stripe Customer Lookup (MCP Preferred)
**With MCP:** "Find the Stripe customer for user email sam@example.com and show their subscription status"

**With CLI:**
```bash
stripe customers list --email sam@example.com
stripe subscriptions list --customer cus_xxx
```

### Example 3: Vercel Deployment (CLI Preferred)
**With CLI:**
```bash
vercel deploy --prod
```

**With MCP:** Not recommended unless you have a custom MCP server set up.

### Example 4: GitHub PR Creation (CLI Preferred)
**With CLI:**
```bash
gh pr create --title "Add notifications feature" --body "Implements user notifications"
```

**With MCP:** Not available yet.

---

## Best Practices

1. **Start with MCP for Supabase and Stripe** — These have official support and work well with AI assistance
2. **Use CLI for GitHub and Vercel** — More reliable and faster for these services currently
3. **Combine Both Approaches** — Use MCP for exploration and CLI for automation
4. **Document Your Workflows** — Keep notes on which approach works best for your specific use cases
5. **Stay Updated** — MCP ecosystem is evolving; check for new official servers regularly

---

## Troubleshooting

### MCP Not Working?
- Check MCP server configuration in Cursor settings
- Verify API keys and authentication
- Try CLI as fallback for critical operations

### CLI Command Failing?
- Check authentication (`supabase login`, `stripe login`, `vercel login`)
- Verify project linking
- Check service status pages

---

## References

- [Supabase MCP Documentation](https://supabase.com/mcp)
- [Stripe MCP Documentation](https://docs.stripe.com/mcp)
- [Vercel MCP Deployment Guide](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)

---

**Last Updated:** February 2026  
**Status:** Active Reference Guide
