import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CreateStaffPayload = {
  email?: string;
  role?: 'staff' | 'admin';
  assigned_region?: string;
  assigned_district?: string | null;
};

const DEFAULT_STAFF_PASSWORD = 'Staff@1234';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authorization = req.headers.get('Authorization') ?? '';
    const jwt = authorization.replace('Bearer ', '').trim();

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase function environment is not configured.');
    }

    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await adminClient.auth.getUser(jwt);

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile, error: profileLookupError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle();

    if (profileLookupError) {
      throw profileLookupError;
    }

    if (!callerProfile || callerProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as CreateStaffPayload;
    const email = payload.email?.trim().toLowerCase() ?? '';
    const role = payload.role === 'admin' ? 'admin' : 'staff';
    const assignedRegion = payload.assigned_region?.trim() ?? '';
    const assignedDistrict = payload.assigned_district?.trim() || null;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!assignedRegion) {
      return new Response(JSON.stringify({ error: 'Assigned region is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const nameParts = email.split('@')[0].split('.').filter(Boolean);
    const firstName = nameParts[0] ?? 'Staff';
    const lastName = nameParts[1] ?? 'User';
    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password: DEFAULT_STAFF_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role,
        first_name: firstName,
        last_name: lastName,
        assigned_region: assignedRegion,
        assigned_district: assignedDistrict,
        must_change_password: true,
      },
    });

    if (createUserError) {
      const status = createUserError.message.toLowerCase().includes('already') ? 409 : 400;
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: upsertError } = await adminClient
      .from('users')
      .upsert({
        id: createdUser.user.id,
        first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        email,
        role,
        assigned_region: assignedRegion,
        assigned_district: assignedDistrict,
        is_verified: true,
        nationality: 'Tanzanian',
        account_status: 'active',
        email_verified: true,
      }, { onConflict: 'id' });

    if (upsertError) {
      throw upsertError;
    }

    return new Response(
      JSON.stringify({
        userId: createdUser.user.id,
        email,
        tempPassword: DEFAULT_STAFF_PASSWORD,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});