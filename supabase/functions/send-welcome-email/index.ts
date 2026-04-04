const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
console.log('SENDGRID_API_KEY configured:', !!sendgridApiKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const createWelcomeEmail = (name: string, siteUrl: string) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مرحباً بك في المُنحنى</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f4ee; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f4ee; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header with logo -->
          <tr>
            <td align="center" style="padding: 30px 0 20px;">
              <img src="${siteUrl}/monlogo.png" alt="المُنحنى" style="height: 60px; width: auto;" />
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 52, 58, 0.08);">
                
                <!-- Top accent bar -->
                <tr>
                  <td style="background: linear-gradient(135deg, #00343a 0%, #004d56 100%); height: 6px; font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>

                <!-- Welcome heading -->
                <tr>
                  <td align="center" style="padding: 48px 40px 16px;">
                    <h1 style="color: #00343a; font-size: 28px; font-weight: 700; margin: 0; line-height: 1.4;">
                      مرحباً بك ${name} 👋
                    </h1>
                  </td>
                </tr>

                <!-- Subtitle -->
                <tr>
                  <td align="center" style="padding: 0 40px 32px;">
                    <p style="color: #5a7a7e; font-size: 16px; line-height: 28px; margin: 0;">
                      يسعدنا انضمامك إلى فريق الكتّاب في منصة المنحنى
                    </p>
                  </td>
                </tr>

                <!-- Success Badge -->
                <tr>
                  <td align="center" style="padding: 0 40px 32px;">
                    <table cellpadding="0" cellspacing="0" style="background-color: #f0faf6; border: 1px solid #d4ede4; border-radius: 12px; width: 100%;">
                      <tr>
                        <td align="center" style="padding: 24px 20px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-left: 10px;">
                                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #00343a, #006d5b); border-radius: 50%; text-align: center; line-height: 48px; font-size: 24px;">✓</div>
                              </td>
                              <td>
                                <p style="color: #00343a; font-size: 18px; font-weight: 700; margin: 0;">تم قبول طلبك بنجاح</p>
                                <p style="color: #5a7a7e; font-size: 14px; margin: 4px 0 0;">يمكنك الآن البدء بنشر محتواك</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Features -->
                <tr>
                  <td style="padding: 0 40px 32px;">
                    <p style="color: #00343a; font-size: 16px; font-weight: 600; margin: 0 0 16px; text-align: right;">ما يمكنك فعله الآن:</p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 10px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 36px; vertical-align: top;">
                                <div style="width: 32px; height: 32px; background-color: #f6f4ee; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">📝</div>
                              </td>
                              <td style="padding-right: 12px; vertical-align: middle;">
                                <p style="color: #333; font-size: 15px; margin: 0;">كتابة ونشر المقالات</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 36px; vertical-align: top;">
                                <div style="width: 32px; height: 32px; background-color: #f6f4ee; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">📰</div>
                              </td>
                              <td style="padding-right: 12px; vertical-align: middle;">
                                <p style="color: #333; font-size: 15px; margin: 0;">نشر الأخبار والتحديثات</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 36px; vertical-align: top;">
                                <div style="width: 32px; height: 32px; background-color: #f6f4ee; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">👤</div>
                              </td>
                              <td style="padding-right: 12px; vertical-align: middle;">
                                <p style="color: #333; font-size: 15px; margin: 0;">إدارة ملفك الشخصي</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding: 0 40px 40px;">
                    <a href="${siteUrl}/auth" style="display: inline-block; background: linear-gradient(135deg, #00343a 0%, #004d56 100%); color: #f6f4ee; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 12px; padding: 16px 48px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0, 52, 58, 0.3);">
                      تسجيل الدخول الآن ←
                    </a>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <hr style="border: none; border-top: 1px solid #e8e6e0; margin: 0;">
                  </td>
                </tr>

                <!-- Help text -->
                <tr>
                  <td style="padding: 24px 40px 32px;">
                    <p style="color: #5a7a7e; font-size: 14px; line-height: 24px; margin: 0; text-align: right;">
                      إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا عبر البريد الإلكتروني
                      <a href="mailto:info@almonhna.sa" style="color: #00343a; font-weight: 600; text-decoration: none;">info@almonhna.sa</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px 20px 16px;">
              <p style="color: #8a9a9c; font-size: 13px; line-height: 22px; margin: 0;">
                مع أطيب التحيات، فريق المنحنى
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 20px 32px;">
              <p style="color: #b0bec0; font-size: 12px; margin: 0;">
                <a href="${siteUrl}" style="color: #8a9a9c; text-decoration: none;">almonhna.sa</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { email, name, siteUrl: customSiteUrl } = await req.json()

    if (!email || !name) {
      console.error('Missing required fields: email or name')
      return new Response(
        JSON.stringify({ error: 'Email and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!sendgridApiKey) {
      console.error('SENDGRID_API_KEY is not configured')
      return new Response(
        JSON.stringify({ error: 'SendGrid API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Sending welcome email to:', email)

    const siteUrl = customSiteUrl || 'https://almonhna.sa'
    const html = createWelcomeEmail(name, siteUrl)

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
            subject: '🎉 مرحباً بك في المنحنى - تم قبول طلبك!',
          },
        ],
        from: {
          email: 'info@almonhna.sa',
          name: 'المنحنى',
        },
        content: [
          {
            type: 'text/html',
            value: html,
          },
        ],
      }),
    })

    console.log('SendGrid response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SendGrid error:', errorText)
      throw new Error(`SendGrid error: ${response.status} - ${errorText}`)
    }

    console.log('Email sent successfully via SendGrid')

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in send-welcome-email function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({
        error: {
          message: errorMessage,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
