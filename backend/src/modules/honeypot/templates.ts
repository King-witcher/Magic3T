/**
 * Honeypot HTML templates.
 *
 * These pages are designed to look like authentic PHP admin panels
 * while containing absolutely zero real information. Every credential,
 * hostname, and configuration value is completely fabricated.
 */

// ────────────────────── Helpers ──────────────────────

const csrfToken = () =>
  Array.from({ length: 40 }, () =>
    'abcdef0123456789'[Math.floor(Math.random() * 16)]
  ).join('')

const sessionId = () =>
  Array.from({ length: 26 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('')

// ────────────────────── Admin Login ──────────────────────

export function adminLoginPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel - Login</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="generator" content="AdminLTE 3.2.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #e9ecef; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .login-box { width: 360px; }
    .login-logo { text-align: center; margin-bottom: 20px; }
    .login-logo a { font-size: 28px; font-weight: 700; color: #495057; text-decoration: none; }
    .login-logo span { color: #007bff; }
    .card { background: #fff; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,.1); overflow: hidden; }
    .card-body { padding: 30px; }
    .card-body p { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
    .input-group { position: relative; margin-bottom: 16px; }
    .input-group input { width: 100%; padding: 10px 40px 10px 14px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px; transition: border-color .15s; }
    .input-group input:focus { outline: none; border-color: #80bdff; box-shadow: 0 0 0 3px rgba(0,123,255,.12); }
    .input-group .icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #adb5bd; font-size: 14px; }
    .btn-primary { width: 100%; padding: 10px; background: #007bff; color: #fff; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; transition: background .2s; }
    .btn-primary:hover { background: #0069d9; }
    .row { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 13px; }
    .row a { color: #007bff; text-decoration: none; }
    .row label { display: flex; align-items: center; gap: 6px; color: #666; cursor: pointer; }
    .alert { padding: 12px 16px; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 4px; margin-bottom: 16px; font-size: 13px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #adb5bd; }
  </style>
</head>
<body>
  <div class="login-box">
    <div class="login-logo">
      <a href="/admin.php"><span>Admin</span>Panel</a>
    </div>
    <div class="card">
      <div class="card-body">
        <p>Sign in to start your session</p>
        ${error ? `<div class="alert">${error}</div>` : ''}
        <form action="/admin.php" method="post" autocomplete="off">
          <input type="hidden" name="_token" value="${csrfToken()}">
          <input type="hidden" name="session_id" value="${sessionId()}">
          <div class="input-group">
            <input type="text" name="username" placeholder="Username" required autocomplete="off">
            <span class="icon">&#128100;</span>
          </div>
          <div class="input-group">
            <input type="password" name="password" placeholder="Password" required autocomplete="off">
            <span class="icon">&#128274;</span>
          </div>
          <div class="input-group">
            <input type="text" name="otp_code" placeholder="2FA Code (if enabled)" autocomplete="off">
            <span class="icon">&#128272;</span>
          </div>
          <button type="submit" class="btn-primary">Sign In</button>
          <div class="row">
            <label><input type="checkbox" name="remember"> Remember Me</label>
            <a href="/admin.php?page=setup">Forgot password?</a>
          </div>
        </form>
      </div>
    </div>
    <div class="footer">
      Copyright &copy; 2024 Magic3T Administration v4.2.1
      <br>Powered by PHP 8.2.13
    </div>
  </div>
  <!-- Session: ${sessionId()} -->
  <!-- Server: web-prod-03 -->
  <!-- Build: 4.2.1-stable (2024-08-15) -->
</body>
</html>`
}

// ────────────────────── Admin Dashboard ──────────────────────

export function adminDashboardPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Panel - Dashboard</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f9; }
    .navbar { background: #343a40; color: #fff; padding: 0 20px; height: 57px; display: flex; align-items: center; justify-content: space-between; }
    .navbar .brand { font-size: 18px; font-weight: 700; color: #fff; text-decoration: none; }
    .navbar .brand span { color: #17a2b8; }
    .navbar-nav { display: flex; gap: 16px; list-style: none; }
    .navbar-nav a { color: #c2c7d0; text-decoration: none; font-size: 14px; }
    .sidebar { position: fixed; left: 0; top: 57px; width: 250px; bottom: 0; background: #343a40; padding-top: 10px; overflow-y: auto; }
    .sidebar a { display: block; padding: 10px 20px; color: #c2c7d0; text-decoration: none; font-size: 14px; border-left: 3px solid transparent; }
    .sidebar a:hover, .sidebar a.active { background: #2c3136; border-left-color: #17a2b8; color: #fff; }
    .sidebar .section { padding: 12px 20px 6px; font-size: 11px; text-transform: uppercase; color: #6c757d; letter-spacing: .5px; }
    .content { margin-left: 250px; padding: 20px; }
    .breadcrumb { font-size: 13px; color: #6c757d; margin-bottom: 20px; }
    .breadcrumb a { color: #007bff; text-decoration: none; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #fff; border-radius: 6px; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,.05); border-left: 4px solid; }
    .stat-card.blue { border-left-color: #007bff; }
    .stat-card.green { border-left-color: #28a745; }
    .stat-card.yellow { border-left-color: #ffc107; }
    .stat-card.red { border-left-color: #dc3545; }
    .stat-card h3 { font-size: 28px; margin-bottom: 4px; color: #333; }
    .stat-card p { font-size: 13px; color: #999; text-transform: uppercase; }
    .card { background: #fff; border-radius: 6px; box-shadow: 0 0 10px rgba(0,0,0,.05); margin-bottom: 20px; }
    .card-header { padding: 14px 20px; border-bottom: 1px solid #eee; font-weight: 600; color: #495057; display: flex; justify-content: space-between; align-items: center; }
    .card-body { padding: 16px 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
    th { color: #6c757d; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    .badge-info { background: #d1ecf1; color: #0c5460; }
    .loading-bar { position: fixed; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #17a2b8, #007bff); animation: loading 2s ease-in-out; opacity: 0; }
    @keyframes loading { 0% { width: 0; opacity: 1; } 80% { width: 100%; opacity: 1; } 100% { width: 100%; opacity: 0; } }
  </style>
</head>
<body>
  <div class="loading-bar"></div>
  <nav class="navbar">
    <a href="/admin.php?page=dashboard" class="brand"><span>Admin</span>Panel</a>
    <ul class="navbar-nav">
      <li><a href="#">&#128276; Notifications (3)</a></li>
      <li><a href="#">&#9881; Settings</a></li>
      <li><a href="/admin.php">&#128682; Logout</a></li>
    </ul>
  </nav>

  <div class="sidebar">
    <div class="section">Navigation</div>
    <a href="/admin.php?page=dashboard" class="active">&#128200; Dashboard</a>
    <a href="/admin.php?page=users">&#128101; User Management</a>
    <a href="/admin.php?page=config">&#9881; Configuration</a>
    <div class="section">System</div>
    <a href="/admin.php?page=setup">&#128295; Setup Wizard</a>
    <a href="/phpinfo.php">&#128196; PHP Info</a>
    <a href="#">&#128202; Reports</a>
    <a href="#">&#128451; Backups</a>
    <div class="section">Advanced</div>
    <a href="#">&#128187; Console</a>
    <a href="#">&#128218; Logs</a>
    <a href="#">&#128268; API Keys</a>
  </div>

  <div class="content">
    <div class="breadcrumb">
      <a href="/admin.php?page=dashboard">Home</a> / Dashboard
    </div>

    <div class="stats">
      <div class="stat-card blue"><h3>14,832</h3><p>Registered Users</p></div>
      <div class="stat-card green"><h3>1,247</h3><p>Active Sessions</p></div>
      <div class="stat-card yellow"><h3>87</h3><p>Pending Reports</p></div>
      <div class="stat-card red"><h3>12</h3><p>System Alerts</p></div>
    </div>

    <div class="card">
      <div class="card-header">
        Recent Activity
        <span style="font-size: 12px; color: #999;">Last 24 hours</span>
      </div>
      <div class="card-body">
        <table>
          <thead>
            <tr><th>Time</th><th>User</th><th>Action</th><th>IP Address</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>2 min ago</td><td>admin</td><td>Login attempt</td><td>192.168.1.105</td><td><span class="badge badge-success">Success</span></td></tr>
            <tr><td>15 min ago</td><td>moderator01</td><td>User ban</td><td>10.0.0.23</td><td><span class="badge badge-warning">Pending</span></td></tr>
            <tr><td>1 hr ago</td><td>system</td><td>Database backup</td><td>127.0.0.1</td><td><span class="badge badge-success">Success</span></td></tr>
            <tr><td>2 hrs ago</td><td>admin</td><td>Config update</td><td>192.168.1.105</td><td><span class="badge badge-info">Info</span></td></tr>
            <tr><td>3 hrs ago</td><td>unknown</td><td>Failed login (5x)</td><td>45.33.32.156</td><td><span class="badge badge-danger">Blocked</span></td></tr>
            <tr><td>5 hrs ago</td><td>api_service</td><td>Cron job executed</td><td>127.0.0.1</td><td><span class="badge badge-success">Success</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header">System Information</div>
      <div class="card-body">
        <table>
          <tbody>
            <tr><td style="width:200px;font-weight:600;">Server OS</td><td>Ubuntu 22.04.3 LTS</td></tr>
            <tr><td style="font-weight:600;">PHP Version</td><td>8.2.13</td></tr>
            <tr><td style="font-weight:600;">MySQL Version</td><td>8.0.35</td></tr>
            <tr><td style="font-weight:600;">Apache Version</td><td>2.4.57</td></tr>
            <tr><td style="font-weight:600;">Redis</td><td>7.2.3 (connected)</td></tr>
            <tr><td style="font-weight:600;">Uptime</td><td>47 days, 12 hours, 33 minutes</td></tr>
            <tr><td style="font-weight:600;">Memory Usage</td><td>2.1 GB / 8 GB (26.3%)</td></tr>
            <tr><td style="font-weight:600;">Disk Usage</td><td>34.7 GB / 100 GB (34.7%)</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <!-- Session: ${sessionId()} | Node: web-prod-03 -->
</body>
</html>`
}

// ────────────────────── Users Page ──────────────────────

export function adminUsersPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Panel - User Management</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f9; }
    .navbar { background: #343a40; color: #fff; padding: 0 20px; height: 57px; display: flex; align-items: center; justify-content: space-between; }
    .navbar .brand { font-size: 18px; font-weight: 700; color: #fff; text-decoration: none; }
    .navbar .brand span { color: #17a2b8; }
    .sidebar { position: fixed; left: 0; top: 57px; width: 250px; bottom: 0; background: #343a40; padding-top: 10px; }
    .sidebar a { display: block; padding: 10px 20px; color: #c2c7d0; text-decoration: none; font-size: 14px; border-left: 3px solid transparent; }
    .sidebar a:hover, .sidebar a.active { background: #2c3136; border-left-color: #17a2b8; color: #fff; }
    .sidebar .section { padding: 12px 20px 6px; font-size: 11px; text-transform: uppercase; color: #6c757d; }
    .content { margin-left: 250px; padding: 20px; }
    .card { background: #fff; border-radius: 6px; box-shadow: 0 0 10px rgba(0,0,0,.05); }
    .card-header { padding: 14px 20px; border-bottom: 1px solid #eee; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
    .card-body { padding: 16px 20px; }
    .search-bar { display: flex; gap: 10px; margin-bottom: 16px; }
    .search-bar input { flex: 1; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px; }
    .search-bar select { padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px; }
    .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
    .btn-sm { padding: 4px 10px; font-size: 12px; }
    .btn-primary { background: #007bff; color: #fff; }
    .btn-danger { background: #dc3545; color: #fff; }
    .btn-success { background: #28a745; color: #fff; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
    th { color: #6c757d; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    .pagination { display: flex; gap: 4px; margin-top: 16px; justify-content: center; }
    .pagination a { padding: 6px 12px; border: 1px solid #dee2e6; border-radius: 4px; color: #007bff; text-decoration: none; font-size: 13px; }
    .pagination a.active { background: #007bff; color: #fff; border-color: #007bff; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #6c757d; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; margin-right: 8px; vertical-align: middle; }
  </style>
</head>
<body>
  <nav class="navbar">
    <a href="/admin.php?page=dashboard" class="brand"><span>Admin</span>Panel</a>
    <div><a href="/admin.php" style="color:#c2c7d0;text-decoration:none;">&#128682; Logout</a></div>
  </nav>

  <div class="sidebar">
    <div class="section">Navigation</div>
    <a href="/admin.php?page=dashboard">&#128200; Dashboard</a>
    <a href="/admin.php?page=users" class="active">&#128101; User Management</a>
    <a href="/admin.php?page=config">&#9881; Configuration</a>
    <div class="section">System</div>
    <a href="/admin.php?page=setup">&#128295; Setup Wizard</a>
    <a href="/phpinfo.php">&#128196; PHP Info</a>
  </div>

  <div class="content">
    <div class="card">
      <div class="card-header">
        User Management
        <button class="btn btn-primary btn-sm">+ Add User</button>
      </div>
      <div class="card-body">
        <div class="search-bar">
          <input type="text" placeholder="Search users by name, email, or ID...">
          <select>
            <option>All Roles</option>
            <option>Admin</option>
            <option>Moderator</option>
            <option>User</option>
            <option>Banned</option>
          </select>
          <button class="btn btn-primary">Search</button>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>User</th><th>Email</th><th>Role</th><th>Registered</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><span class="avatar">SA</span> superadmin</td>
              <td>admin@magic3t.com</td>
              <td>Admin</td>
              <td>2023-01-15</td>
              <td><span class="badge badge-success">Active</span></td>
              <td><button class="btn btn-sm btn-primary">Edit</button> <button class="btn btn-sm btn-danger">Ban</button></td>
            </tr>
            <tr>
              <td>2</td>
              <td><span class="avatar">JD</span> john_doe</td>
              <td>john.doe@example.com</td>
              <td>Moderator</td>
              <td>2023-03-22</td>
              <td><span class="badge badge-success">Active</span></td>
              <td><button class="btn btn-sm btn-primary">Edit</button> <button class="btn btn-sm btn-danger">Ban</button></td>
            </tr>
            <tr>
              <td>3</td>
              <td><span class="avatar">JS</span> jane_smith</td>
              <td>jane.s@example.com</td>
              <td>User</td>
              <td>2023-05-10</td>
              <td><span class="badge badge-success">Active</span></td>
              <td><button class="btn btn-sm btn-primary">Edit</button> <button class="btn btn-sm btn-danger">Ban</button></td>
            </tr>
            <tr>
              <td>4</td>
              <td><span class="avatar">BT</span> bot_tester</td>
              <td>tester@tempmail.org</td>
              <td>User</td>
              <td>2024-01-03</td>
              <td><span class="badge badge-danger">Banned</span></td>
              <td><button class="btn btn-sm btn-primary">Edit</button> <button class="btn btn-sm btn-success">Unban</button></td>
            </tr>
            <tr>
              <td>5</td>
              <td><span class="avatar">MR</span> mod_rachel</td>
              <td>rachel.m@example.com</td>
              <td>Moderator</td>
              <td>2023-08-19</td>
              <td><span class="badge badge-warning">Inactive</span></td>
              <td><button class="btn btn-sm btn-primary">Edit</button> <button class="btn btn-sm btn-danger">Ban</button></td>
            </tr>
          </tbody>
        </table>
        <div class="pagination">
          <a href="#" class="active">1</a>
          <a href="#">2</a>
          <a href="#">3</a>
          <a href="#">...</a>
          <a href="#">148</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

// ────────────────────── DB Config Page ──────────────────────

export function adminDbConfigPage(message?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Panel - Configuration</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f9; }
    .navbar { background: #343a40; color: #fff; padding: 0 20px; height: 57px; display: flex; align-items: center; }
    .navbar .brand { font-size: 18px; font-weight: 700; color: #fff; text-decoration: none; }
    .navbar .brand span { color: #17a2b8; }
    .sidebar { position: fixed; left: 0; top: 57px; width: 250px; bottom: 0; background: #343a40; padding-top: 10px; }
    .sidebar a { display: block; padding: 10px 20px; color: #c2c7d0; text-decoration: none; font-size: 14px; border-left: 3px solid transparent; }
    .sidebar a:hover, .sidebar a.active { background: #2c3136; border-left-color: #17a2b8; color: #fff; }
    .sidebar .section { padding: 12px 20px 6px; font-size: 11px; text-transform: uppercase; color: #6c757d; }
    .content { margin-left: 250px; padding: 20px; }
    .card { background: #fff; border-radius: 6px; box-shadow: 0 0 10px rgba(0,0,0,.05); margin-bottom: 20px; }
    .card-header { padding: 14px 20px; border-bottom: 1px solid #eee; font-weight: 600; }
    .card-body { padding: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 14px; color: #495057; }
    .form-group input, .form-group select { width: 100%; max-width: 500px; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px; }
    .form-group .hint { font-size: 12px; color: #999; margin-top: 4px; }
    .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .btn-primary { background: #007bff; color: #fff; }
    .btn-secondary { background: #6c757d; color: #fff; margin-left: 8px; }
    .alert-success { padding: 12px 16px; background: #d4edda; border: 1px solid #c3e6cb; color: #155724; border-radius: 4px; margin-bottom: 16px; }
    .alert-warning { padding: 12px 16px; background: #fff3cd; border: 1px solid #ffeeba; color: #856404; border-radius: 4px; margin-bottom: 16px; }
    .tab-nav { display: flex; border-bottom: 2px solid #dee2e6; margin-bottom: 20px; }
    .tab-nav a { padding: 10px 20px; text-decoration: none; color: #6c757d; font-size: 14px; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab-nav a.active { color: #007bff; border-bottom-color: #007bff; }
  </style>
</head>
<body>
  <nav class="navbar">
    <a href="/admin.php?page=dashboard" class="brand"><span>Admin</span>Panel</a>
  </nav>

  <div class="sidebar">
    <div class="section">Navigation</div>
    <a href="/admin.php?page=dashboard">&#128200; Dashboard</a>
    <a href="/admin.php?page=users">&#128101; User Management</a>
    <a href="/admin.php?page=config" class="active">&#9881; Configuration</a>
    <div class="section">System</div>
    <a href="/admin.php?page=setup">&#128295; Setup Wizard</a>
    <a href="/phpinfo.php">&#128196; PHP Info</a>
  </div>

  <div class="content">
    ${message ? `<div class="alert-success">${message}</div>` : ''}
    <div class="alert-warning">&#9888; Changes to database configuration require a service restart. Proceed with caution.</div>

    <div class="card">
      <div class="card-header">System Configuration</div>
      <div class="card-body">
        <div class="tab-nav">
          <a href="#" class="active">Database</a>
          <a href="#">Cache (Redis)</a>
          <a href="#">Email (SMTP)</a>
          <a href="#">Security</a>
          <a href="#">API Keys</a>
        </div>

        <form action="/admin.php?page=config" method="post">
          <input type="hidden" name="_token" value="${csrfToken()}">

          <div class="form-group">
            <label>Database Host</label>
            <input type="text" name="db_host" value="internal-db-prod-01.magic3t.local">
            <div class="hint">Internal hostname of the primary database server</div>
          </div>
          <div class="form-group">
            <label>Database Port</label>
            <input type="text" name="db_port" value="3306">
          </div>
          <div class="form-group">
            <label>Database Name</label>
            <input type="text" name="db_name" value="magic3t_prod">
          </div>
          <div class="form-group">
            <label>Database Username</label>
            <input type="text" name="db_user" value="app_readwrite">
          </div>
          <div class="form-group">
            <label>Database Password</label>
            <input type="password" name="db_password" value="rw_s3cur3_p4ss_2024!">
            <div class="hint">Last changed: 2024-06-15 by superadmin</div>
          </div>
          <div class="form-group">
            <label>Connection Pool Size</label>
            <input type="number" name="pool_size" value="25">
          </div>
          <div class="form-group">
            <label>SSL Mode</label>
            <select name="ssl_mode">
              <option value="require" selected>Require</option>
              <option value="verify-ca">Verify CA</option>
              <option value="verify-full">Verify Full</option>
              <option value="disable">Disable</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary">Save Configuration</button>
          <button type="button" class="btn btn-secondary">Test Connection</button>
        </form>
      </div>
    </div>
  </div>
</body>
</html>`
}

// ────────────────────── Setup / Forgot Password ──────────────────────

export function adminSetupPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Panel - Account Recovery</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #e9ecef; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .box { width: 420px; background: #fff; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,.1); padding: 30px; }
    .box h2 { font-size: 20px; color: #333; margin-bottom: 6px; }
    .box p { color: #666; font-size: 14px; margin-bottom: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 14px; color: #495057; }
    .form-group input { width: 100%; padding: 10px 14px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px; }
    .form-group .hint { font-size: 12px; color: #999; margin-top: 4px; }
    .btn-primary { width: 100%; padding: 10px; background: #007bff; color: #fff; border: none; border-radius: 4px; font-size: 15px; cursor: pointer; }
    .btn-primary:hover { background: #0069d9; }
    .steps { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .step { text-align: center; flex: 1; position: relative; }
    .step .num { width: 32px; height: 32px; border-radius: 50%; background: #dee2e6; color: #6c757d; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; margin-bottom: 4px; }
    .step.active .num { background: #007bff; color: #fff; }
    .step .label { font-size: 11px; color: #999; }
    .back-link { display: block; text-align: center; margin-top: 16px; color: #007bff; text-decoration: none; font-size: 14px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="steps">
      <div class="step active"><div class="num">1</div><div class="label">Verify Email</div></div>
      <div class="step"><div class="num">2</div><div class="label">Security Q</div></div>
      <div class="step"><div class="num">3</div><div class="label">Reset</div></div>
    </div>
    <h2>Account Recovery</h2>
    <p>Enter the email address associated with your admin account. A verification code will be sent.</p>
    <form action="/admin.php" method="post">
      <input type="hidden" name="_token" value="${csrfToken()}">
      <input type="hidden" name="action" value="recover">
      <div class="form-group">
        <label>Admin Email Address</label>
        <input type="email" name="email" placeholder="admin@magic3t.com" required>
        <div class="hint">Must match the email registered to the admin account</div>
      </div>
      <div class="form-group">
        <label>Recovery Key (optional)</label>
        <input type="text" name="recovery_key" placeholder="XXXX-XXXX-XXXX-XXXX">
        <div class="hint">32-character recovery key provided during initial setup</div>
      </div>
      <button type="submit" class="btn-primary">Send Verification Code</button>
    </form>
    <a href="/admin.php" class="back-link">&larr; Back to Login</a>
  </div>
</body>
</html>`
}

// ────────────────────── WordPress Login ──────────────────────

export function wpLoginPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log In &lsaquo; Magic3T &mdash; WordPress</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f1f1f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif; min-height: 100vh; }
    .login { width: 320px; margin: 8% auto 0; }
    .login h1 { text-align: center; margin-bottom: 24px; }
    .login h1 a { display: inline-block; width: 84px; height: 84px; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23464646"/><text x="50" y="62" text-anchor="middle" font-size="32" font-weight="bold" fill="white" font-family="sans-serif">WP</text></svg>') no-repeat center; background-size: contain; text-indent: -9999px; overflow: hidden; }
    #login { background: #fff; border: 1px solid #c3c4c7; box-shadow: 0 1px 3px rgba(0,0,0,.04); padding: 26px 24px; border-radius: 4px; }
    .login-error { border-left: 4px solid #d63638; background: #fff; padding: 12px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,.04); font-size: 13px; color: #50575e; }
    .form-label { display: block; margin-bottom: 3px; font-size: 14px; font-weight: 600; color: #1d2327; }
    .form-input { width: 100%; padding: 3px 5px; font-size: 24px; border: 1px solid #8c8f94; border-radius: 4px; margin-bottom: 16px; }
    .form-input:focus { border-color: #2271b1; box-shadow: 0 0 0 1px #2271b1; outline: none; }
    .forgetmenot { margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
    .forgetmenot label { font-size: 13px; color: #50575e; }
    #wp-submit { background: #2271b1; border: none; color: #fff; padding: 0 12px; height: 36px; font-size: 13px; border-radius: 4px; cursor: pointer; min-width: 100%; font-weight: 600; }
    #wp-submit:hover { background: #135e96; }
    .login-nav { text-align: center; margin-top: 16px; }
    .login-nav a { color: #50575e; text-decoration: none; font-size: 13px; }
    .login-nav a:hover { color: #2271b1; }
    .login-footer { text-align: center; margin-top: 20px; }
    .login-footer a { font-size: 13px; color: #50575e; text-decoration: none; }
  </style>
</head>
<body class="login-page">
  <div class="login">
    <h1><a href="https://wordpress.org/">Powered by WordPress</a></h1>
    ${error ? `<div class="login-error">${error}</div>` : ''}
    <div id="login">
      <form name="loginform" action="/wp-login.php" method="post">
        <p>
          <label class="form-label" for="user_login">Username or Email Address</label>
          <input type="text" name="log" id="user_login" class="form-input" autocomplete="username" required>
        </p>
        <p>
          <label class="form-label" for="user_pass">Password</label>
          <input type="password" name="pwd" id="user_pass" class="form-input" autocomplete="current-password" required>
        </p>
        <div class="forgetmenot">
          <input type="checkbox" name="rememberme" id="rememberme" value="forever">
          <label for="rememberme">Remember Me</label>
        </div>
        <p>
          <input type="hidden" name="redirect_to" value="/wp-admin/">
          <input type="hidden" name="testcookie" value="1">
          <button type="submit" id="wp-submit">Log In</button>
        </p>
      </form>
    </div>
    <p class="login-nav">
      <a href="/wp-login.php?action=lostpassword">Lost your password?</a>
    </p>
    <p class="login-footer">
      <a href="/">&larr; Go to Magic3T</a>
    </p>
  </div>
</body>
</html>`
}

// ────────────────────── phpinfo() ──────────────────────

export function phpInfoPage(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>phpinfo()</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    body { background: #fff; color: #000; font-family: sans-serif; }
    table { border-collapse: collapse; width: 934px; margin: 0 auto 10px; }
    td, th { border: 1px solid #666; padding: 4px 8px; font-size: 13px; vertical-align: top; }
    th { background: #4F5155; color: #fff; font-weight: 600; }
    .h { background: #9999cc; font-weight: bold; color: #000; }
    .e { background: #ccccff; }
    .v { background: #dcdcdc; max-width: 300px; overflow-wrap: break-word; }
    h1 { text-align: center; font-size: 28px; margin: 20px 0 10px; }
    h2 { font-size: 18px; background: #9999cc; padding: 6px; color: #000; width: 934px; margin: 10px auto 0; }
    .center { text-align: center; }
    .logo { text-align: center; margin: 20px 0; }
    hr { width: 934px; margin: 10px auto; border: 1px solid #ccc; }
  </style>
</head>
<body>
  <div class="logo">
    <h1>PHP Version 8.2.13</h1>
  </div>

  <table>
    <tr><td class="e">System</td><td class="v">Linux web-prod-03 5.15.0-91-generic #101-Ubuntu SMP x86_64</td></tr>
    <tr><td class="e">Build Date</td><td class="v">Nov 21 2024 18:45:02</td></tr>
    <tr><td class="e">Server API</td><td class="v">Apache 2.0 Handler</td></tr>
    <tr><td class="e">Virtual Directory Support</td><td class="v">disabled</td></tr>
    <tr><td class="e">Configuration File (php.ini) Path</td><td class="v">/etc/php/8.2/apache2</td></tr>
    <tr><td class="e">Loaded Configuration File</td><td class="v">/etc/php/8.2/apache2/php.ini</td></tr>
    <tr><td class="e">PHP API</td><td class="v">20220829</td></tr>
    <tr><td class="e">PHP Extension</td><td class="v">20220829</td></tr>
    <tr><td class="e">Zend Extension</td><td class="v">420220829</td></tr>
    <tr><td class="e">Document Root</td><td class="v">/var/www/magic3t/public</td></tr>
    <tr><td class="e">Server Administrator</td><td class="v">webmaster@magic3t.com</td></tr>
    <tr><td class="e">DOCUMENT_ROOT</td><td class="v">/var/www/magic3t/public</td></tr>
    <tr><td class="e">SERVER_SOFTWARE</td><td class="v">Apache/2.4.57 (Ubuntu)</td></tr>
  </table>

  <h2>mysql</h2>
  <table>
    <tr class="h"><th>Directive</th><th>Local Value</th><th>Master Value</th></tr>
    <tr><td class="e">mysqli.default_host</td><td class="v">internal-db-prod-01.magic3t.local</td><td class="v">internal-db-prod-01.magic3t.local</td></tr>
    <tr><td class="e">mysqli.default_port</td><td class="v">3306</td><td class="v">3306</td></tr>
    <tr><td class="e">mysqli.default_socket</td><td class="v">/var/run/mysqld/mysqld.sock</td><td class="v">/var/run/mysqld/mysqld.sock</td></tr>
    <tr><td class="e">mysqli.default_user</td><td class="v">app_readonly</td><td class="v">app_readonly</td></tr>
    <tr><td class="e">mysqli.reconnect</td><td class="v">Off</td><td class="v">Off</td></tr>
  </table>

  <h2>session</h2>
  <table>
    <tr class="h"><th>Directive</th><th>Local Value</th><th>Master Value</th></tr>
    <tr><td class="e">session.save_handler</td><td class="v">redis</td><td class="v">redis</td></tr>
    <tr><td class="e">session.save_path</td><td class="v">tcp://cache-prod-01.magic3t.local:6379?auth=c4ch3_p4ss_2024</td><td class="v">tcp://cache-prod-01.magic3t.local:6379?auth=c4ch3_p4ss_2024</td></tr>
    <tr><td class="e">session.gc_maxlifetime</td><td class="v">1440</td><td class="v">1440</td></tr>
    <tr><td class="e">session.cookie_httponly</td><td class="v">On</td><td class="v">On</td></tr>
    <tr><td class="e">session.cookie_secure</td><td class="v">On</td><td class="v">On</td></tr>
  </table>

  <h2>openssl</h2>
  <table>
    <tr class="h"><th>Directive</th><th>Local Value</th><th>Master Value</th></tr>
    <tr><td class="e">OpenSSL support</td><td class="v">enabled</td><td class="v">enabled</td></tr>
    <tr><td class="e">OpenSSL Library Version</td><td class="v">OpenSSL 3.0.11 19 Sep 2023</td><td class="v">OpenSSL 3.0.11 19 Sep 2023</td></tr>
    <tr><td class="e">openssl.cafile</td><td class="v">/etc/ssl/certs/ca-certificates.crt</td><td class="v">/etc/ssl/certs/ca-certificates.crt</td></tr>
  </table>

  <h2>Environment</h2>
  <table>
    <tr class="h"><th>Variable</th><th>Value</th></tr>
    <tr><td class="e">HOSTNAME</td><td class="v">web-prod-03</td></tr>
    <tr><td class="e">APP_ENV</td><td class="v">production</td></tr>
    <tr><td class="e">DB_HOST</td><td class="v">internal-db-prod-01.magic3t.local</td></tr>
    <tr><td class="e">REDIS_HOST</td><td class="v">cache-prod-01.magic3t.local</td></tr>
    <tr><td class="e">HOME</td><td class="v">/var/www</td></tr>
    <tr><td class="e">PATH</td><td class="v">/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin</td></tr>
  </table>

  <hr>
  <div class="center">
    <p>PHP Credits - <a href="/phpinfo.php?credits">Full Page</a></p>
  </div>
</body>
</html>`
}
