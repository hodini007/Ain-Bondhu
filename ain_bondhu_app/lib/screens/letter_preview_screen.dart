import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:animate_do/animate_do.dart';

class LetterPreviewScreen extends StatelessWidget {
  const LetterPreviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('অভিযোগ পত্র প্রিভিউ', style: TextStyle(color: Colors.white)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: FadeInUp(
          child: Column(
            children: [
              _buildLetterPaper(context),
              const SizedBox(height: 30),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildActionButton(
                    context, 
                    Icons.save_alt, 
                    'সেভ করুন', 
                    Colors.blue.shade700,
                    () => _showToast(context, 'PDF সেভ করা হচ্ছে...'),
                  ),
                  _buildActionButton(
                    context, 
                    Icons.share, 
                    'শেয়ার করুন', 
                    Colors.green.shade700,
                    () => Share.share('আমার আইনি অভিযোগ পত্রটি দেখুন। সাহায্য প্রয়োজন।'),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLetterPaper(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        boxShadow: [
          BoxShadow(color: Colors.black12, blurRadius: 15, spreadRadius: 5),
        ],
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: Text('তারিখ: ০৬ মে, ২০২৬', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          SizedBox(height: 20),
          Text('বরাবর,'),
          Text('ব্যবস্থাপক,'),
          Text('[কারখানার নাম],'),
          Text('মিরপুর, ঢাকা।'),
          SizedBox(height: 20),
          Text('বিষয়: বকেয়া বেতন পরিশোধের জন্য আবেদন।', style: TextStyle(fontWeight: FontWeight.bold)),
          SizedBox(height: 20),
          Text('জনাব,'),
          Text(
            'বিনীত নিবেদন এই যে, আমি আপনার কারখানায় গত ২ বছর ধরে অপারেটর হিসেবে কর্মরত আছি। অত্যন্ত পরিতাপের বিষয় এই যে, গত ৩ মাস যাবৎ আমি আমার ন্যায্য পাওনা বেতন পাচ্ছি না। বাংলাদেশ শ্রম আইন ২০০৬ এর ধারা ১২১ অনুযায়ী সময়মতো বেতন পরিশোধ করা বাধ্যতামূলক।',
            textAlign: TextAlign.justify,
          ),
          SizedBox(height: 15),
          Text(
            'এমতাবস্থায়, আমার বকেয়া বেতন আগামী ৭ কার্যদিবসের মধ্যে পরিশোধ করার জন্য বিনীত অনুরোধ জানাচ্ছি। অন্যথায় আমি আইনের আশ্রয় নিতে বাধ্য হব।',
            textAlign: TextAlign.justify,
          ),
          SizedBox(height: 40),
          Text('নিবেদক,'),
          Text('[শ্রমিকের নাম]'),
          Text('কার্ড নং: ১২৩৪৫'),
        ],
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, IconData icon, String label, Color color, VoidCallback onPressed) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        elevation: 5,
      ),
    );
  }

  void _showToast(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }
}
