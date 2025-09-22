## Staff Authentication - Test Credentials

You can now access the staff dashboards using email and password authentication. Here are the test credentials:

### Available Staff Accounts:

**Restaurant Staff:**
- Email: `restaurant@onetapstay.com`
- Password: `restaurant123`
- Access: Restaurant Dashboard

**Spa Staff:**
- Email: `spa@onetapstay.com`
- Password: `spa123`
- Access: Spa Dashboard

**Gym Staff:**
- Email: `gym@onetapstay.com`
- Password: `gym123`
- Access: Gym Dashboard

**Pool Staff:**
- Email: `pool@onetapstay.com`
- Password: `pool123`
- Access: Pool Bar Dashboard

**General Staff:**
- Email: `staff@onetapstay.com`
- Password: `staff123`
- Access: All Facilities

### How to Access:

1. Go to: `http://localhost:3000/staff/auth`
2. Select your facility type
3. Enter your email and password
4. Click "Sign In" to access your dashboard

### Features:

- **Facility Selection**: Choose your specific facility during login
- **Role-based Access**: Staff can only access authorized areas
- **Secure Authentication**: JWT-based authentication with proper session management
- **Dashboard Redirect**: Automatically redirected to your facility's dashboard
- **Session Persistence**: Stay logged in across browser refreshes

### Dashboard URLs:

After login, you'll be redirected to:
- Restaurant: `/staff/restaurant`
- Spa: `/staff/spa`
- Gym: `/staff/gym`
- Pool: `/staff/pool`

Each dashboard includes:
- Guest lookup by booking ID
- Service addition with pricing
- Payment status management
- Real-time facility statistics
- Guest journey timeline integration