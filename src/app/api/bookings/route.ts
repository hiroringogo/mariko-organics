import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}                                                    
                                                                                                
  export async function POST(request: Request) {                                                
    const body = await request.json();                                                          
                                                                                                
    const {                                                                                     
      lessonId,                                                                                 
      name,                                                                                     
      email,                                                                                    
      phone,                                                                                    
      participantCount,                                                                         
      companions,                                                                               
      companionEmails,                                                                          
      companionFirstTime,                                                                       
      notes,                                                                                    
      isFirstTime,                                                                              
      referredBy,                                                                               
    } = body;                                                                                   
                                                                                                
    if (!lessonId || !name || !email || !participantCount) {                                    
      return NextResponse.json(                                                                 
        { error: "Missing required fields" },                                                   
        { status: 400 }                                                                         
      );                                      
    }                                                                                           
                                                                                                
    if (typeof participantCount !== "number" || participantCount < 1 || participantCount > 6) { 
      return NextResponse.json(                                                                 
        { error: "Invalid participant count" },                                                 
        { status: 400 }                                                                         
      );                                      
    }                                                                                           
                                                                                                
    const { data: lesson, error: lessonError } = await supabase                                 
      .from("lesson_with_seats")                                                                
      .select("seats_remaining, total_seats")                                                   
      .eq("id", lessonId)                                                                       
      .single();                              
                                                                                                
    if (lessonError || !lesson) {                                                               
      return NextResponse.json(                                                                 
        { error: "Lesson not found" },                                                          
        { status: 404 }                                                                         
      );                                                                                        
    }                                                                                           
                                                                                                
    if (lesson.seats_remaining <= 0) {                                                          
      return NextResponse.json(                                                                 
        { error: "fully_booked" },                                                              
        { status: 409 }                                                                         
      );                                                                                        
    }                                                                                           
                                                                                                
    if (participantCount > lesson.seats_remaining) {                                            
      return NextResponse.json(                                                                 
        { error: "not_enough_seats", seatsRemaining: lesson.seats_remaining },                  
        { status: 409 }                                                                         
      );                                                                                        
    }                                                                                           
                                                                                                
    const { error: insertError } = await supabase.from("bookings").insert({                     
      lesson_id: lessonId,                                                                      
      name,                                                                                     
      email,                                                                                    
      phone: phone ?? null,                                                                     
      participant_count: participantCount,                                                      
      companion_names:                        
        Array.isArray(companions) && companions.length > 0 ? companions : null,                 
      companion_emails:                       
        Array.isArray(companionEmails) && companionEmails.some(Boolean)                         
          ? companionEmails                                                                     
          : null,                                                                               
      companion_first_time:                                                                     
        Array.isArray(companionFirstTime) && companionFirstTime.some(Boolean)                   
          ? companionFirstTime                                                                  
          : null,                                                                               
      notes: notes ?? null,                                                                     
      is_first_time: isFirstTime ?? false,                                                      
      referred_by: referredBy ?? null,                                                          
    });                                                                                         
                                                                                                
    if (insertError) {                                                                          
      return NextResponse.json(                                                                 
        { error: insertError.message },                                                         
        { status: 500 }                                                                         
      );                                                                                        
    }                                                                                           
                                                                                                
    return NextResponse.json({ success: true });
  }

export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
